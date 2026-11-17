import { useReducer, useCallback } from 'react';

interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
}

type FormAction<T> =
  | { type: 'SET_FIELD'; field: string; value: any }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'CLEAR_ERROR'; field: string }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_VALUES'; values: T | ((prev: T) => T) }
  | { type: 'RESET'; initialValues: T };

function formReducer<T extends Record<string, any>>(state: FormState<T>, action: FormAction<T>): FormState<T> {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.field]: action.value },
        errors: { ...state.errors, [action.field]: '' },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'CLEAR_ERROR': {
      const copy = { ...state.errors };
      delete copy[action.field];
      return { ...state, errors: copy };
    }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting };
    case 'SET_VALUES': {
      const newValues = typeof action.values === 'function' ? action.values(state.values) : action.values;
      return { ...state, values: newValues };
    }
    case 'RESET':
      return {
        values: action.initialValues,
        errors: {},
        isSubmitting: false,
      };
    default:
      return state;
  }
}

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) {
  const [state, dispatch] = useReducer(formReducer<T>, {
    values: initialValues,
    errors: {},
    isSubmitting: false,
  });

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    dispatch({ type: 'SET_FIELD', field: id, value });
  }, []);

  const setValues = useCallback((newValues: T | ((prev: T) => T)) => {
    dispatch({ type: 'SET_VALUES', values: newValues });
  }, []);

  const setErrors = useCallback((errors: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => {
    if (typeof errors === 'function') {
      // dispatch with calculated errors
      dispatch({ type: 'SET_ERRORS', errors: errors(state.errors) });
    } else {
      dispatch({ type: 'SET_ERRORS', errors });
    }
  }, [state.errors]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET', initialValues });
  }, [initialValues]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch({ type: 'SET_SUBMITTING', isSubmitting: true });
    dispatch({ type: 'SET_ERRORS', errors: {} });
    try {
      await onSubmit(state.values);
    } catch (err: any) {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors) {
        dispatch({ type: 'SET_ERRORS', errors: fieldErrors });
      } else {
        dispatch({
          type: 'SET_ERRORS',
          errors: {
            global: err.response?.data?.message || err.message || 'Error al procesar el formulario'
          }
        });
      }
    } finally {
      dispatch({ type: 'SET_SUBMITTING', isSubmitting: false });
    }
  }, [state.values, onSubmit]);

  return {
    values: state.values,
    setValues,
    errors: state.errors,
    setErrors,
    isSubmitting: state.isSubmitting,
    handleChange,
    resetForm,
    handleSubmit
  };
}

export default useForm;
