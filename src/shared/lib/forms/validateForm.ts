import type { FormFieldType, PrimitiveType } from '@/shared/types';

type MaskType = 'alnum' | 'plate' | 'phone' | 'number' | 'cost' | 'percent';

export function validateForm(schema: FormFieldType, value: PrimitiveType) {
  if (schema.required) {
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string' && !value.trim()) {
      return false;
    }
  }

  if (schema.maxLength && typeof value === 'string') {
    if (value.length > schema.maxLength) {
      return false;
    }
  }

  if (schema.minLength && typeof value === 'string') {
    if (value.length < schema.minLength) {
      return false;
    }
  }

  if (schema.mask) {
    const strValue = String(value ?? '').trim();

    switch (schema.mask as MaskType) {
      case 'alnum': {
        const regex = /^[A-Z0-9]+$/i;
        if (!regex.test(strValue)) {
          return false;
        }
        break;
      }
      case 'plate': {
        const regex = /^[A-ZА-Я]\d{3}[A-ZА-Я]{1,2}\d{2,3}$/i;
        if (!regex.test(strValue)) {
          return false;
        }
        break;
      }
      case 'phone': {
        const regex = /^8-\d{3}-\d{3}-\d{2}-\d{2}$/;
        if (!regex.test(strValue)) {
          return false;
        }
        break;
      }
      case 'number': {
        const num = Number(strValue.replace(/\s/g, '').replace(',', '.'));
        if (isNaN(num)) {
          return false;
        }
        break;
      }
      case 'cost': {
        const cleaned = strValue.replace(/\s/g, '');
        if (!/^[-]?\d*(?:[.,]?\d*)?$/.test(cleaned)) {
          return false;
        }

        const num = Number(cleaned.replace(',', '.'));
        if (isNaN(num)) {
          return false;
        }

        break;
      }

      case 'percent': {
        const num = Number(strValue);
        if (isNaN(num) || num < -999 || num > 999) {
          return false;
        }
        break;
      }
    }
  }

  return true;
}
