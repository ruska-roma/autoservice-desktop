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
import { NavLink } from 'react-router';

import {
  ACCOUNT_FORM_SCHEMA,
  type AccountType,
  type ClientType,
  getAccountClient,
  updateAccount,
} from '@/entities';
import { isDefined, validateForm } from '@/shared/lib';
import { toaster } from '@/shared/ui';

interface IEditAccountProps {
  data: AccountType;
  handleRefreshData: () => void;
  containerProps?: StackProps;
}

type FormData = Record<keyof AccountType, string>;

export const EditAccount = ({ data, handleRefreshData, containerProps }: IEditAccountProps) => {
  const [client, setClient] = useState<ClientType | null>(null);

  const [formData, setFormData] = useState<FormData | null>(
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) as FormData,
  );
  const [initialData, setInitialData] = useState<FormData | null>(
    Object.fromEntries(Object.entries(data).map(([k, v]) => [k, v ?? ''])) as FormData,
  );
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    getAccountClient(data.id_account).then(setClient);
  }, [data]);

  const handleChange = (key: keyof AccountType, value: string) => {
    const schema = ACCOUNT_FORM_SCHEMA.find((f) => f.key === key);

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
      if (value !== initialData?.[key as keyof AccountType]) {
        newFormData[key] = value;
      }
    }

    const result = await updateAccount(data.id_account, newFormData);
    if (result?.success) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись счета успешно обновлена',
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
      ([key, value]) => value !== initialData[key as keyof AccountType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return Object.entries(formData).every(([key, value]) => {
      if (value === initialData[key as keyof AccountType]) {
        return true;
      }
      const schema = ACCOUNT_FORM_SCHEMA.find((f) => f.key === key);
      return schema ? validateForm(schema, value) : true;
    });
  }, [formData, initialData]);

  const isClientExists = isDefined(client) && client.id_client;

  return (
    <Stack
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex
        px={5}
        py={4}
        direction="row"
        align="center"
        justify="space-between"
        borderBottomWidth="1px"
      >
        <Text textStyle="xl" fontWeight="medium">
          Данные счета
        </Text>
      </Flex>
      <Grid px={5} py={4} gap={4} templateColumns="repeat(2, 1fr)">
        {ACCOUNT_FORM_SCHEMA.map(
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
      <Flex
        px={5}
        pb={5}
        gap={5}
        align="center"
        justify={isClientExists ? 'space-between' : 'flex-end'}
      >
        {!!isClientExists && (
          <NavLink to={`/client/${client.id_client.toString()}`}>
            <Button rounded="lg">Перейти к клиенту</Button>
          </NavLink>
        )}
        <Flex justify="flex-end" gap={3}>
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
      </Flex>
    </Stack>
  );
};
