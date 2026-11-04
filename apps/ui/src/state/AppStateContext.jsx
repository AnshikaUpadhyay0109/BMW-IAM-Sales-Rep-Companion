import React, { createContext, useContext, useReducer } from 'react';
import { REPS, ME } from '../data/reps';

const DEFAULT_FORM = {
  topics: [],
  notes: '',
  pl24: '',
  aos: '',
  challenges: [],
  challengeOther: '',
  opportunities: [],
  opportunityOther: '',
  competitors: '',
  photos: [],
  actionItems: [{ text: '', owner: REPS[ME].name, due: '', prio: 'Medium' }],
  status: '',
  aiSummary: '',
  visitId: '',
  voiceNoteKey: null,
  transcriptSegments: [],
  fullTranscript: '',
  visitNoteSummary: '',
};

const INITIAL = {
  user: null,
  view: 'home',
  selectedDealer: null,
  repFilter: null,
  search: '',
  signalFilter: 'all',
  sortBy: 'signal',
  openDealerIds: [],
  form: { ...DEFAULT_FORM },
  dealerVisitStatus: {},
  reports: [],
  toast: null,
  dealers: [],
  dealersLoading: false,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.user };

    case 'LOGOUT':
      return { ...INITIAL };

    case 'SET_VIEW':
      return { ...state, view: action.view };

    case 'GO_HOME':
      return { ...state, view: 'home', selectedDealer: null, form: { ...DEFAULT_FORM, actionItems: [{ text: '', owner: REPS[ME].name, due: '', prio: 'Medium' }] } };

    case 'GO_REVIEW':
      return { ...state, view: 'review' };

    case 'SELECT_DEALER':
      return { ...state, selectedDealer: action.dealer, view: 'visit', form: { ...DEFAULT_FORM, actionItems: [{ text: '', owner: REPS[state.user?.repId || ME].name, due: '', prio: 'Medium' }] } };

    case 'TOGGLE_DEALER': {
      const ids = state.openDealerIds;
      return { ...state, openDealerIds: ids.includes(action.id) ? ids.filter(x => x !== action.id) : [...ids, action.id] };
    }

    case 'SET_REP_FILTER':
      return { ...state, repFilter: action.repFilter };

    case 'SET_SEARCH':
      return { ...state, search: action.search };

    case 'SET_SIGNAL_FILTER':
      return { ...state, signalFilter: action.signalFilter };

    case 'SET_SORT':
      return { ...state, sortBy: action.sortBy };

    case 'TOGGLE_FORM_ARRAY': {
      const arr = state.form[action.field] || [];
      const next = arr.includes(action.value) ? arr.filter(x => x !== action.value) : [...arr, action.value];
      return { ...state, form: { ...state.form, [action.field]: next } };
    }

    case 'SET_FORM_FIELD':
      return { ...state, form: { ...state.form, [action.field]: action.value } };

    case 'SET_TOOL':
      return { ...state, form: { ...state.form, tools: { ...state.form.tools, [action.tool]: action.value } } };

    case 'ADD_PHOTO':
      return { ...state, form: { ...state.form, photos: [...state.form.photos, action.photo] } };

    case 'REMOVE_PHOTO':
      return { ...state, form: { ...state.form, photos: state.form.photos.filter((_, i) => i !== action.index) } };

    case 'ADD_ACTION_ITEM':
      return { ...state, form: { ...state.form, actionItems: [...state.form.actionItems, { text: '', owner: '', due: '', prio: 'Medium' }] } };

    case 'UPDATE_ACTION_ITEM': {
      const items = state.form.actionItems.map((a, i) => i === action.index ? { ...a, ...action.data } : a);
      return { ...state, form: { ...state.form, actionItems: items } };
    }

    case 'REMOVE_ACTION_ITEM':
      return { ...state, form: { ...state.form, actionItems: state.form.actionItems.filter((_, i) => i !== action.index) } };

    case 'UPDATE_FORM':
      return { ...state, form: { ...state.form, ...action.updates } };

    case 'SET_REPORT':
      return { ...state, lastViewedReport: action.report };

    case 'SAVE_REPORT': {
      const submitCode = state.selectedDealer?.code;
      const today = new Date().toISOString().slice(0, 10);
      const prevVsSubmit = state.dealerVisitStatus?.[submitCode] || {};
      return {
        ...state,
        reports: [...state.reports, action.report],
        view: 'report',
        dealerVisitStatus: submitCode
          ? { ...state.dealerVisitStatus, [submitCode]: { ...prevVsSubmit, status: 'submitted', visitDate: today, summary: action.summary || prevVsSubmit.summary || null } }
          : state.dealerVisitStatus,
      };
    }

    case 'SHOW_TOAST':
      return { ...state, toast: { message: action.message || action.text, type: action.toastType || action.type2 || 'info' } };

    case 'HIDE_TOAST':
      return { ...state, toast: null };

    case 'SET_DEALER_VISIT_STATUS':
      return { ...state, dealerVisitStatus: { ...state.dealerVisitStatus, [action.dealerCode]: { status: action.status, visitDate: action.visitDate || null } } };

    case 'SET_DEALER_VISIT_STATUSES':
      return { ...state, dealerVisitStatus: { ...state.dealerVisitStatus, ...action.statuses } };

    case 'MARK_REPORT_SEEN': {
      const prev = state.dealerVisitStatus?.[action.dealerCode] || {};
      return { ...state, dealerVisitStatus: { ...state.dealerVisitStatus, [action.dealerCode]: { ...prev, managerViewed: true } } };
    }

    case 'VIEW_REPORT': {
      const prevVs = state.dealerVisitStatus?.[action.dealer.code] || {};
      return {
        ...state,
        selectedDealer: action.dealer,
        lastViewedReport: action.report,
        view: 'report',
        dealerVisitStatus: { ...state.dealerVisitStatus, [action.dealer.code]: { ...prevVs, managerViewed: true } },
      };
    }

    case 'SET_DEALERS_LOADING':
      return { ...state, dealersLoading: action.loading };

    case 'SET_DEALERS':
      return { ...state, dealers: action.dealers, dealersLoading: false };

    default:
      return state;
  }
}

const StateContext = createContext(null);
const DispatchContext = createContext(null);

export function AppStateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}

export function useAppDispatch() {
  return useContext(DispatchContext);
}
