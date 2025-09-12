import { Button, Field, Flex, Grid, GridItem, Input, Stack, Text } from '@chakra-ui/react';
import { useMemo, useState } from 'react';

import { AUTO_FORM_SCHEMA, type AutoType, createAuto } from '@/entities';
import { validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

interface ICreateAutoProps {
  clientId: number;
  onCreate: () => void;
}

type FormData = Record<keyof AutoType, string>;

export const CreateAuto = ({ onCreate, clientId }: ICreateAutoProps) => {
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleChange = (key: keyof AutoType, rawValue: string) => {
    const schema = AUTO_FORM_SCHEMA.find((f) => f.key === key);
    let value = rawValue;

    if (schema?.mask === 'plate') {
      value = value.toUpperCase().replace(/[^A-ZА-Я0-9]/g, '');
      if (value.length > 9) {
        value = value.slice(0, 9);
      }
    }

    if (schema?.mask === 'alnum') {
      value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    }

    if (schema?.transform) {
      value = schema.transform(value);
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

    const result = await createAuto({
      ...formData,
      id_client: clientId,
    });

    if (result) {
      toaster.create({
        title: 'Запись авто успешно добавлена',
        type: 'success',
        closable: true,
        duration: 2000,
      });
      onCreate();
      setIsDialogOpen(false);
    }
  };

  const isFormChanged = useMemo(() => {
    return Object.values(formData).some((v) => v.trim().length > 0);
  }, [formData]);

  const isFormValid = useMemo(() => {
    return AUTO_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  return (
    <>
      <Stack
        h="full"
        minH="150px"
        rounded="xl"
        align="center"
        cursor="pointer"
        justify="center"
        borderWidth="1px"
        borderColor="blue.500"
        borderStyle="dashed"
        backgroundColor="blue.100"
        transition="all 0.15s ease-in-out"
        _hover={{ backgroundColor: 'blue.200' }}
        onClick={() => {
          handleReset();
          setIsDialogOpen(true);
        }}
      >
        <Text color="blue.700" textStyle="md" fontWeight="medium">
          Добавить авто
        </Text>
      </Stack>
      <Modal
        title="Добавление записи"
        isOpen={isDialogOpen}
        onOpen={setIsDialogOpen}
        bodyLayout={
          <Grid templateColumns="repeat(2, 1fr)" gap={4}>
            {AUTO_FORM_SCHEMA.map(
              ({ key, label, type, required, maxLength, disabled, fullWidth }) => {
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
