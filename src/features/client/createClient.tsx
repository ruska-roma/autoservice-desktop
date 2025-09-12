import { Button, Field, Flex, Grid, GridItem, Input } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { PiPlusDuotone } from 'react-icons/pi';
import { useNavigate } from 'react-router';

import { CLIENT_FORM_SCHEMA, type ClientType, createClient } from '@/entities';
import { SCREENS } from '@/shared/config';
import { validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

type FormData = Record<keyof ClientType, string>;

export const CreateClient = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    setFormData({} as FormData);
    setInvalidFields(new Set());
  };

  const handleSave = async () => {
    if (!isFormValid) {
      return;
    }

    const result = await createClient(formData);
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись клиента успешно добавлена',
      });
      setIsDialogOpen(false);
      navigate(`/client/${result.id_client}`, { state: { fromPage: SCREENS.ClientList } });
    }
  };

  const isFormChanged = useMemo(() => {
    return Object.values(formData).some((v) => v.trim().length > 0);
  }, [formData]);

  const isFormValid = useMemo(() => {
    return CLIENT_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  return (
    <>
      <Button
        size="md"
        rounded="lg"
        colorPalette="blue"
        onClick={() => {
          handleReset();
          setIsDialogOpen(true);
        }}
      >
        <PiPlusDuotone />
        Добавить
      </Button>
      <Modal
        title="Добавление записи"
        isOpen={isDialogOpen}
        onOpen={setIsDialogOpen}
        bodyLayout={
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
        }
        footerLayout={
          <Flex gap={3} align="center">
            <Button variant="outline" rounded="lg" disabled={!isFormChanged} onClick={handleReset}>
              Очистить поля
            </Button>
            <Button
              colorPalette="blue"
              rounded="lg"
              disabled={!isFormChanged || !isFormValid}
              onClick={handleSave}
            >
              Создать
            </Button>
          </Flex>
        }
      />
    </>
  );
};
