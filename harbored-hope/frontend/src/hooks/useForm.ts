import { useState, ChangeEvent } from 'react';

type FormState<T> = {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  loading: boolean;
  submitted: boolean;
  apiError: string;
};

type UseFormReturn<T> = FormState<T> & {
  set: (field: keyof T, value: T[keyof T]) => void;
  handleChange: (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleCheckbox: (e: ChangeEvent<HTMLInputElement>) => void;
  setLoading: (v: boolean) => void;
  setSubmitted: (v: boolean) => void;
  setApiError: (msg: string) => void;
  reset: () => void;
  validate: (rules: Partial<Record<keyof T, (v: T[keyof T]) => string | undefined>>) => boolean;
};

export function useForm<T extends Record<string, unknown>>(initial: T): UseFormReturn<T> {
  const [values, setValues]     = useState<T>(initial);
  const [errors, setErrors]     = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading]   = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field: keyof T, value: T[keyof T]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    set(name as keyof T, value as T[keyof T]);
  };

  const handleCheckbox = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    set(name as keyof T, checked as T[keyof T]);
  };

  const validate = (rules: Partial<Record<keyof T, (v: T[keyof T]) => string | undefined>>): boolean => {
    const newErrors: Partial<Record<keyof T, string>> = {};
    let valid = true;
    for (const [field, rule] of Object.entries(rules)) {
      const err = rule?.(values[field as keyof T]);
      if (err) {
        newErrors[field as keyof T] = err;
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const reset = () => {
    setValues(initial);
    setErrors({});
    setLoading(false);
    setSubmitted(false);
    setApiError('');
  };

  return {
    values, errors, loading, submitted, apiError,
    set, handleChange, handleCheckbox,
    setLoading, setSubmitted, setApiError,
    reset, validate,
  };
}
