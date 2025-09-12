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
import { useMemo, useState } from 'react';

import { CLIENT_FORM_SCHEMA, type ClientType, updateClient } from '@/entities';
import { validateForm } from '@/shared/lib';
import { toaster } from '@/shared/ui';

interface IEditClientProps {
  data: ClientType;
  handleRefreshData: () => void;
  containerProps?: StackProps;
}

type FormData = Record<keyof ClientType, string>;

export const EditClient = ({ data, handleRefreshData, containerProps }: IEditClientProps) => {
  const [formData, setFormData] = useState<FormData | null>(
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) as FormData,
  );
  const [initialData, setInitialData] = useState<FormData | null>(
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) as FormData,
  );
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const handleChange = (key: keyof ClientType, rawValue: string) => {
    const schema = CLIENT_FORM_SCHEMA.find((f) => f.key === key);
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
      if (value !== initialData?.[key as keyof ClientType]) {
        newFormData[key] = value;
      }
    }

    const result = await updateClient(data.id_client, newFormData);
    if (result?.success) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись клиента успешно обновлена',
      });

      setInitialData(formData);
      handleRefreshData();
    }
  };

  const isFormChanged = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return Object.entries(formData).some(
      ([key, value]) => value !== initialData[key as keyof ClientType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return CLIENT_FORM_SCHEMA.every((f) => {
      if (formData[f.key] !== initialData[f.key]) {
        return validateForm(f, formData[f.key]);
      }
      return true;
    });
  }, [formData, initialData]);

  return (
    <Stack
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex
        direction="row"
        align="center"
        justify="space-between"
        px={5}
        py={4}
        borderBottomWidth="1px"
      >
        <Text textStyle="xl" fontWeight="medium">
          Данные клиента
        </Text>
      </Flex>
      <Grid px={5} py={4} gap={4} templateColumns="repeat(2, 1fr)">
        {CLIENT_FORM_SCHEMA.map(
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
        <Button
          colorPalette="blue"
          rounded="lg"
          disabled={!isFormChanged || !isFormValid}
          onClick={handleSave}
        >
          Сохранить
        </Button>
      </Flex>
    </Stack>
  );
};
