import {
  Badge,
  Button,
  createListCollection,
  Field,
  Flex,
  Grid,
  GridItem,
  Input,
  Select,
  Stack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { PiPlusDuotone } from 'react-icons/pi';

import {
  type AccountDetailsType,
  CREATE_PART_FORM_SCHEMA,
  createPart,
  type PartType,
} from '@/entities';
import { validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

interface ICreatePartProps {
  data: AccountDetailsType;
  onCreate: () => void;
}

type FormData = Record<keyof PartType, string>;

export const CreatePart = ({ data, onCreate }: ICreatePartProps) => {
  const { works } = data;

  const [isWorkSelected, setIsWorkSelected] = useState(false);
  const [selectedWorkId, setSelectedWorkId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReset = () => {
    setFormData({} as FormData);
    setInvalidFields(new Set());
  };

  const handleChange = (key: keyof PartType, rawValue: string) => {
    const schema = CREATE_PART_FORM_SCHEMA.find((f) => f.key === key);

    let value = rawValue;

    if (schema?.mask === 'number') {
      value = rawValue.replace(/[^0-9.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1]?.length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
    }

    if (schema?.mask === 'cost') {
      const hasMinus = rawValue.trim().startsWith('-');
      let cleaned = rawValue.replace(/[^0-9.]/g, '');
      if (hasMinus) {
        cleaned = '-' + cleaned;
      }
      const parts = cleaned.split('.');
      if (parts.length > 2) {
        cleaned = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1]?.length > 2) {
        cleaned = parts[0] + '.' + parts[1].slice(0, 2);
      }
      if (cleaned && cleaned !== '-') {
        const [intPart, decPart] = cleaned.replace('-', '').split('.');
        const formattedInt = intPart ? new Intl.NumberFormat('ru-RU').format(Number(intPart)) : '';
        value =
          (hasMinus ? '-' : '') +
          (decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt);
      } else {
        value = hasMinus ? '-' : '';
      }
    }

    if (schema?.mask === 'percent') {
      let cleaned = rawValue.replace(/[^0-9-]/g, '');
      if (cleaned.startsWith('-')) {
        cleaned = '-' + cleaned.slice(1).replace(/-/g, '');
        cleaned = cleaned.slice(0, 4);
      } else {
        cleaned = cleaned.replace(/-/g, '');
        cleaned = cleaned.slice(0, 3);
      }
      if (/^-?0\d/.test(cleaned)) {
        cleaned = cleaned.replace(/^(-?)0+/, '$1');
      }
      value = cleaned;
    }

    setFormData((prev) => ({ ...prev, [key]: value }));
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

  const handleSave = async () => {
    if (!isFormValid || !selectedWorkId) {
      return;
    }
    const result = await createPart({
      ...formData,
      id_work: selectedWorkId,
      description: formData.description?.trim() || 'Без названия',
      part_unit: formData.part_unit || null,
      part_count: formData.part_count ? Number(formData.part_count.replace(',', '.')) : 'шт.',
      part_cost: formData.part_cost
        ? Number(formData.part_cost.replace(/\s/g, '').replace(',', '.'))
        : 0,
      discount: formData.discount ? Number(formData.discount) / 100 : 0,
    });

    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись запчасти успешно добавлена',
      });
      onCreate();
      setIsDialogOpen(false);
    }
  };

  const isFormChanged = useMemo(() => {
    return Object.values(formData).some((v) => v.trim().length > 0);
  }, [formData]);

  const isFormValid = useMemo(() => {
    return CREATE_PART_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  const workCollection = useMemo(
    () =>
      createListCollection({
        items: works.map((work) => ({
          label: work.description,
          value: String(work.id_work),
        })),
      }),
    [works],
  );

  return (
    <>
      <Button
        size="md"
        colorPalette="blue"
        rounded="lg"
        onClick={() => {
          handleReset();
          setIsWorkSelected(false);
          setSelectedWorkId(null);
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
          isWorkSelected ? (
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {CREATE_PART_FORM_SCHEMA.map(
                ({ key, label, type, required, maxLength, disabled, fullWidth, options }) => {
                  if (!formData) {
                    return;
                  }

                  const value = formData[key] ?? '';
                  const placeholder = required ? 'Обязательное поле' : 'Необязательное поле';
                  const isInvalid = invalidFields.has(key);

                  let formItem;

                  if (type === 'select' && options) {
                    const collection = createListCollection({
                      items: options.map((opt) => ({ label: opt, value: opt })),
                    });

                    formItem = (
                      <Field.Root
                        key={key}
                        required={required}
                        disabled={disabled}
                        invalid={isInvalid}
                      >
                        <Field.Label>
                          {label} {required && <Field.RequiredIndicator />}
                        </Field.Label>
                        <Select.Root
                          collection={collection}
                          value={value ? [value] : []}
                          onValueChange={(details) => handleChange(key, details.value[0])}
                          positioning={{ strategy: 'fixed', hideWhenDetached: true }}
                        >
                          <Select.HiddenSelect />
                          <Select.Control>
                            <Select.Trigger>
                              <Select.ValueText placeholder="Выберите опцию..." />
                            </Select.Trigger>
                            <Select.IndicatorGroup>
                              <Select.Indicator />
                            </Select.IndicatorGroup>
                          </Select.Control>
                          <Select.Positioner w="full" maxW={fullWidth ? 464 : 224}>
                            <Select.Content
                              w="full"
                              maxH={200}
                              maxW={fullWidth ? 464 : 224}
                              rounded="lg"
                            >
                              {collection.items.map((item) => (
                                <Select.Item key={item.value} item={item} rounded="md">
                                  <Select.ItemText>{item.label}</Select.ItemText>
                                  <Select.ItemIndicator />
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select.Positioner>
                        </Select.Root>
                      </Field.Root>
                    );
                  } else {
                    formItem = (
                      <Field.Root
                        key={key}
                        required={required}
                        disabled={disabled}
                        invalid={isInvalid}
                      >
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
                  }

                  return fullWidth ? (
                    <GridItem colSpan={2}>{formItem}</GridItem>
                  ) : (
                    <GridItem colSpan={1}>{formItem}</GridItem>
                  );
                },
              )}
            </Grid>
          ) : (
            <Select.Root
              collection={workCollection}
              value={selectedWorkId ? [String(selectedWorkId)] : []}
              onValueChange={(details) => {
                const id = Number(details.value[0]);
                setSelectedWorkId(id);
              }}
              positioning={{ strategy: 'fixed', hideWhenDetached: true }}
              maxW={464}
              w="full"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Выберите работу..." />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner w="full" maxW={464}>
                <Select.Content rounded="lg" w="full" maxW={464} maxH={200}>
                  {workCollection.items.map((item) => (
                    <Select.Item item={item} key={item.value} rounded="md">
                      <Stack w="full" gap="0">
                        <Flex justify="space-between" gap={2} align="baseline">
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Badge colorPalette="blue" size="xs">
                            #{item.value}
                          </Badge>
                        </Flex>
                      </Stack>
                      <Select.ItemIndicator />
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Positioner>
            </Select.Root>
          )
        }
        footerLayout={
          isWorkSelected ? (
            <Flex justify="space-between" align="center" gap={5} w="100%">
              <Button
                rounded="lg"
                onClick={() => {
                  setIsWorkSelected(false);
                  handleReset();
                }}
              >
                Назад
              </Button>
              <Flex gap={3} align="center">
                <Button
                  variant="outline"
                  rounded="lg"
                  disabled={!isFormChanged}
                  onClick={handleReset}
                >
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
            </Flex>
          ) : (
            <Button
              colorPalette="blue"
              rounded="lg"
              disabled={!selectedWorkId}
              onClick={() => setIsWorkSelected(true)}
            >
              Продолжить
            </Button>
          )
        }
      />
    </>
  );
};
