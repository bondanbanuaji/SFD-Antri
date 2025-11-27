'use client';

import { toast } from 'sonner';

export function useNotifications() {
  const success = (message: string, description?: string) => {
    toast.success(message, {
      description,
    });
  };

  const error = (message: string, description?: string) => {
    toast.error(message, {
      description,
    });
  };

  const warning = (message: string, description?: string) => {
    toast.warning(message, {
      description,
    });
  };

  const info = (message: string, description?: string) => {
    toast.info(message, {
      description,
    });
  };

  const promise = <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  };

  return {
    success,
    error,
    warning,
    info,
    promise,
  };
}
