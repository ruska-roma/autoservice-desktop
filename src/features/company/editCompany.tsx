import {
  Button,
  Field,
  Flex,
  Grid,
  GridItem,
  Input,
  Stack,
  type StackProps,
  Text,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';

import {
  COMPANY_FORM_SCHEMA,
  type CompanyType,
  getCompanyDetails,
  updateCompany,
} from '@/entities';
import { SubmitButton } from '@/features';
import { validateForm } from '@/shared/lib';
import { toaster } from '@/shared/ui';

type FormData = Record<keyof CompanyType, string>;

interface IEditCompanyProps {
  containerProps?: StackProps;
}

export function EditCompany({ containerProps }: IEditCompanyProps) {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    getCompanyDetails().then((data) => {
      if (!data) {
        return;
      }

      const normalizedData = Object.fromEntries(
        Object.entries(data).map(([key, value]) => [key, value ?? '']),
      ) as FormData;

      setInitialData(normalizedData);
      setFormData(normalizedData);
    });
  }, []);

  const handleChange = (key: keyof CompanyType, rawValue: string) => {
    const schema = COMPANY_FORM_SCHEMA.find((f) => f.key === key);
    let value = rawValue;

    if (schema?.mask && key === 'phone') {
      const digits = rawValue.replace(/\D/g, '').slice(0, 11);
      let formatted = '8';
      if (digits.length > 1) {
        formatted += `-${digits.slice(1, 4)}`;
      }
      if (digits.length > 4) {
        formatted += `-${digits.slice(4, 7)}`;
      }
      if (digits.length > 7) {
        formatted += `-${digits.slice(7, 9)}`;
      }
      if (digits.length > 9) {
        formatted += `-${digits.slice(9, 11)}`;
      }
      value = formatted;
    }

    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
    setInvalidFields((prev) => {
      const next = new Set(prev);
      if (schema && !validateForm(schema, value)) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleReset = () => {
    setFormData(initialData);
    setInvalidFields(new Set());
  };

  const handleSave = async () => {
    if (!formData || !isFormChanged || !isFormValid) {
      return;
    }

    const newFormData: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== initialData?.[key as keyof CompanyType]) {
        newFormData[key] = value;
      }
    }

    const result = await updateCompany(newFormData);
    if (result?.success) {
      const fresh = await getCompanyDetails();

      if (fresh) {
        const normalizedData = Object.fromEntries(
          Object.entries(fresh).map(([key, value]) => [key, value ?? '']),
        ) as FormData;

        setInitialData(normalizedData);
        setFormData(normalizedData);

        toaster.create({
          type: 'success',
          closable: true,
          duration: 2000,
          title: 'Данные организации успешно обновлены',
        });
      }
    }
  };

  const isFormChanged = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return Object.entries(formData).some(
      ([key, value]) => value !== initialData[key as keyof CompanyType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData) {
      return false;
    }
    return COMPANY_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  return (
    <Stack
      gap={0}
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex px={5} py={4} direction="row" borderBottomWidth="1px">
        <Text textStyle="xl" fontWeight="medium">
          Данные организации
        </Text>
      </Flex>
      <Grid px={5} py={4} gap={4} templateColumns="repeat(2, 1fr)">
        {COMPANY_FORM_SCHEMA.map(
          ({ key, label, type, maxLength, fullWidth, required, disabled }) => {
            if (!formData) {
              return;
            }

            const value = formData[key] ?? '';
            const placeholder = required ? 'Обязательное поле' : 'Необязательное поле';
            const isInvalid = invalidFields.has(key);

            const formItem = (
              <Field.Root key={key} required={required} disabled={disabled} invalid={isInvalid}>
                <Field.Label>
                  {label} {required && <Field.RequiredIndicator />}
                </Field.Label>
                <Input
                  type={type}
                  value={value}
                  outline="none"
                  maxLength={maxLength}
                  placeholder={placeholder}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </Field.Root>
            );

            return fullWidth ? (
              <GridItem colSpan={2}>{formItem}</GridItem>
            ) : (
              <GridItem colSpan={1}>{formItem}</GridItem>
            );
          },
        )}
      </Grid>
      <Flex justify="flex-end" px={5} pb={5} gap={3}>
        <Button variant="outline" rounded="lg" disabled={!isFormChanged} onClick={handleReset}>
          Отмена
        </Button>
        <SubmitButton
          disabled={!isFormChanged || !isFormValid}
          onConfirm={handleSave}
          beforeConfirm={() => {
            if (!isFormValid) {
              return false;
            }
            return true;
          }}
        >
          Сохранить
        </SubmitButton>
      </Flex>
    </Stack>
  );
}
