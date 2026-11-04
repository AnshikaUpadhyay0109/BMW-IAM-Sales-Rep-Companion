import json
import os
from decimal import Decimal

import boto3
from boto3.dynamodb.conditions import Attr, Key

VISIT_CAPTURE_TABLE_NAME = os.environ.get("VISIT_CAPTURE_TABLE_NAME", "bmw_visit_capture-dev")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json",
}

dynamo = boto3.resource("dynamodb", region_name="eu-central-1")


def _sanitize(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, dict):
        return {k: _sanitize(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize(i) for i in obj]
    return obj


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        dealer_code = event["pathParameters"]["dealer_code"]
        params = event.get("queryStringParameters") or {}
        form_type = params.get("form_type")
        visit_date = params.get("visit_date")
        status_filter = params.get("status")

        filter_expr = None
        if form_type:
            filter_expr = Attr("form_type").eq(form_type)
        if visit_date:
            date_filter = Attr("visit_date").eq(visit_date)
            filter_expr = filter_expr & date_filter if filter_expr else date_filter
        if status_filter:
            status_f = Attr("status").eq(status_filter)
            filter_expr = filter_expr & status_f if filter_expr else status_f

        query_kwargs = {
            "KeyConditionExpression": Key("dealer_code").eq(dealer_code),
        }
        if filter_expr:
            query_kwargs["FilterExpression"] = filter_expr

        table = dynamo.Table(VISIT_CAPTURE_TABLE_NAME)
        response = table.query(**query_kwargs)
        items = response.get("Items", [])

        if not items:
            return {
                "statusCode": 200,
                "headers": CORS_HEADERS,
                "body": json.dumps({"visit": None}),
            }

        # Sort by updated_at descending to get the latest visit
        items.sort(key=lambda x: x.get("updated_at", ""), reverse=True)
        item = items[0]

        visit = _sanitize({
            "visit_id": item.get("visit_id"),
            "status": item.get("status"),
            "visit_date": item.get("visit_date"),
            "form_data": item.get("form_data"),
            "form_type": item.get("form_type"),
            "sales_rep_id": item.get("sales_rep_id"),
            "submitted_by": item.get("submitted_by"),
            "updated_at": item.get("updated_at"),
            "manager_viewed": item.get("manager_viewed"),
            "recommendation_id": item.get("recommendation_id"),
        })

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"visit": visit}),
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
