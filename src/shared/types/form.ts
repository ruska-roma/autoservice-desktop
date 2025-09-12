export type PrimitiveType = string | number | null;

export type ObjectKeyType<T> = Extract<keyof T, string>;

export type InputFieldType = 'text' | 'number' | 'date' | 'select';

export type FormFieldType<K extends string = string> = {
  key: K;
  label: string;
  type: InputFieldType;
  maxLength: number;
  minLength?: number;
  required?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  mask?: string;
  options?: string[];
  transform?: (value: any) => any;
};

export type FormDataItem<K extends string = string> = {
  key: K;
  value: PrimitiveType;
};
