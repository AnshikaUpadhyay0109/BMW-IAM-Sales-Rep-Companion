import json
import os

import boto3

VISIT_CAPTURE_TABLE_NAME = os.environ.get("VISIT_CAPTURE_TABLE_NAME", "bmw_visit_capture-dev")
DEALER_TABLE_NAME        = os.environ.get("DEALER_TABLE_NAME", "dibmw-dealer-cache-dev")

CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,PUT,PATCH,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Content-Type": "application/json",
}

dynamo = boto3.resource("dynamodb", region_name="eu-central-1")


def lambda_handler(event, context):
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS_HEADERS, "body": ""}

    try:
        dealer_code = event["pathParameters"]["dealer_code"]
        visit_id = event["pathParameters"]["visit_id"]

        raw_body = event.get("body") or "{}"
        body = json.loads(raw_body) if isinstance(raw_body, str) else raw_body

        table = dynamo.Table(VISIT_CAPTURE_TABLE_NAME)
        http_method = event.get("httpMethod", "PUT").upper()

        if http_method == "PATCH":
            # Partial update — only update the fields provided in the body
            update_parts = []
            expr_names = {}
            expr_values = {}
            for i, (key, value) in enumerate(body.items()):
                if key in ("dealer_code", "visit_id"):
                    continue
                attr_name = f"#k{i}"
                attr_value = f":v{i}"
                update_parts.append(f"{attr_name} = {attr_value}")
                expr_names[attr_name] = key
                expr_values[attr_value] = value

            if update_parts:
                table.update_item(
                    Key={"dealer_code": dealer_code, "visit_id": visit_id},
                    UpdateExpression="SET " + ", ".join(update_parts),
                    ExpressionAttributeNames=expr_names,
                    ExpressionAttributeValues=expr_values,
                )
        else:
            # PUT — full replace (existing behaviour)
            item = {
                "dealer_code": dealer_code,
                "visit_id": visit_id,
                **body,
            }
            recommendation_id = body.get("recommendation_id")
            if recommendation_id is not None:
                item["recommendation_id"] = recommendation_id

            table.put_item(Item=item)

            if body.get("status") == "submitted":
                try:
                    dynamo.Table(DEALER_TABLE_NAME).delete_item(
                        Key={"dealer_code": dealer_code, "sk": "INSIGHTS_LATEST"}
                    )
                except Exception as e:
                    print(f"[save_visit_capture] Failed to invalidate insights cache for {dealer_code}: {e}")

        return {
            "statusCode": 200,
            "headers": CORS_HEADERS,
            "body": json.dumps({"saved": True}),
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "headers": CORS_HEADERS,
            "body": json.dumps({"error": str(e)}),
        }
