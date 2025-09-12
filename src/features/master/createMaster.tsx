import { Button, Field, Flex, Grid, GridItem, Input } from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { PiPlusDuotone } from 'react-icons/pi';

import { createMaster, MASTER_FORM_SCHEMA, type MasterType } from '@/entities';
import { validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

type FormData = Record<keyof MasterType, string>;

interface ICreateMasterProps {
  onCreate: () => void;
}

export const CreateMaster = ({ onCreate }: ICreateMasterProps) => {
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleChange = (key: keyof MasterType, value: string) => {
    const schema = MASTER_FORM_SCHEMA.find((f) => f.key === key);

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

    const result = await createMaster({ name: formData.name });
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись мастера успешно добавлена',
      });
      onCreate();
      setIsDialogOpen(false);
    }
  };

  const isFormChanged = useMemo(() => {
    return Object.values(formData).some((v) => v.trim().length > 0);
  }, [formData]);

  const isFormValid = useMemo(() => {
    return MASTER_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  return (
    <>
      <Button
        size="md"
        colorPalette="blue"
        rounded="lg"
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
            {MASTER_FORM_SCHEMA.map(({ key, label, type, required, maxLength }) => (
              <GridItem colSpan={2} key={key}>
                <Field.Root required={required} invalid={invalidFields.has(key)}>
                  <Field.Label>
                    {label} {required && <Field.RequiredIndicator />}
                  </Field.Label>
                  <Input
                    type={type}
                    value={formData[key] ?? ''}
                    outline="none"
                    maxLength={maxLength}
                    placeholder={required ? 'Обязательное поле' : 'Необязательное поле'}
                    onChange={(e) => handleChange(key, e.target.value)}
                  />
                </Field.Root>
              </GridItem>
            ))}
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
