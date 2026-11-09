import { useState, useCallback } from 'react';

export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void>
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setValues(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear error for field on change
    if (errors[id]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    }
  }, [errors]);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  }, [initialValues]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      await onSubmit(values);
    } catch (err: any) {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors) {
        setErrors(fieldErrors);
      } else {
        setErrors({
          global: err.response?.data?.message || err.message || 'Error al procesar el formulario'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  return {
    values,
    setValues,
    errors,
    setErrors,
    isSubmitting,
    handleChange,
    resetForm,
    handleSubmit
  };
}

export default useForm;
