import {
  Button,
  createListCollection,
  Field,
  Flex,
  Grid,
  GridItem,
  Input,
  Select,
  Stack,
  type StackProps,
  Table,
  Text,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';

import {
  type AccountDetailsType,
  deleteWork,
  getMastersList,
  type MasterType,
  updateWork,
  WORK_FORM_SCHEMA,
  WORK_TABLE_COLUMNS,
  type WorkType,
} from '@/entities';
import { formatCurrency, getTodayISO, validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

import { CreateWork } from './createWork';

interface IWorkListProps {
  data: AccountDetailsType;
  isDataExists: boolean;
  totalWorksCost: number;
  containerProps?: StackProps;
  handleRefreshData: () => void;
}

type FormData = Record<keyof WorkType, string>;

export const WorkList = ({
  data,
  isDataExists,
  totalWorksCost,
  containerProps,
  handleRefreshData,
}: IWorkListProps) => {
  const { works } = data;

  const [masters, setMasters] = useState<MasterType[]>([]);
  const [selectedWork, setSelectedWork] = useState<WorkType | null>(null);

  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const formatValue = (mask: string | undefined, rawValue: string) => {
    if (!rawValue) {
      return '';
    }

    if (mask === 'number') {
      let value = rawValue.replace(/[^0-9.]/g, '');
      const parts = value.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      }
      if (parts[1]?.length > 2) {
        value = parts[0] + '.' + parts[1].slice(0, 2);
      }
      return value;
    }

    if (mask === 'cost') {
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
        return (
          (hasMinus ? '-' : '') +
          (decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt)
        );
      }
      return hasMinus ? '-' : '';
    }

    if (mask === 'percent') {
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
      return cleaned;
    }

    return rawValue;
  };

  const handleTableItemClick = async (work: WorkType) => {
    const data = await getMastersList();
    if (!data || data.length === 0) {
      toaster.create({
        type: 'error',
        closable: true,
        title: 'Невозможно обновить запись',
        description: 'Список мастеров пуст. Добавьте хотя бы одного мастера.',
      });
      return;
    }

    const normalizedData = Object.fromEntries(
      Object.entries(work).map(([k, v]) => {
        const schema = WORK_FORM_SCHEMA.find((f) => f.key === k);
        return [k, formatValue(schema?.mask, String(v ?? ''))];
      }),
    ) as FormData;

    if (normalizedData.id_master) {
      const hasMaster = data.some((master) => String(master.id_master) === String(work.id_master));
      normalizedData.id_master = hasMaster ? String(work.id_master) : '';
    }

    setMasters(data);
    setSelectedWork(work);
    setFormData(normalizedData);
    setInitialData(normalizedData);
    setInvalidFields(new Set());
    setIsDialogOpen(true);
  };

  const handleChange = (key: keyof WorkType, rawValue: string) => {
    const schema = WORK_FORM_SCHEMA.find((f) => f.key === key);
    const value = formatValue(schema?.mask, rawValue);

    setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
    setInvalidFields((prev) => {
      const next = new Set(prev);
      if (!initialData) {
        return next;
      }
      const initial = initialData[key] ?? '';
      if (value === initial) {
        next.delete(key);
        return next;
      }
      if (schema && !validateForm(schema, value)) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!formData || !selectedWork || !isFormValid) {
      return;
    }

    const normalizeDate = (dateStr: string): string => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return getTodayISO();
      }
      return d.toISOString().split('T')[0];
    };

    const diff: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(formData)) {
      if (value === initialData?.[key as keyof WorkType]) {
        continue;
      }

      switch (key) {
        case 'id_master':
          diff[key] = value ? Number(value) : null;
          break;

        case 'work_hours':
          diff[key] = value ? Number(value.replace(',', '.')) : 0;
          break;

        case 'work_cost':
          diff[key] = value ? Number(value.replace(/\s/g, '').replace(',', '.')) : 0;
          break;

        case 'discount':
          diff[key] = value ? Number(value) / 100 : 0;
          break;

        case 'date':
          diff[key] = normalizeDate(value) ?? null;
          break;

        case 'description':
          diff[key] = value.trim() || 'Без названия';
          break;

        default:
          diff[key] = value;
          break;
      }
    }

    if (Object.keys(diff).length === 0) {
      setIsDialogOpen(false);
      return;
    }

    const result = await updateWork(selectedWork.id_work, diff);
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись работы успешно обновлена',
      });
      setIsDialogOpen(false);
      handleRefreshData();
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setInvalidFields(new Set());
  };

  const handleDelete = async () => {
    if (!selectedWork) {
      return;
    }

    const result = await deleteWork(selectedWork.id_work);
    if (result) {
      toaster.create({
        title: 'Запись работы успешно удалена',
        type: 'success',
        closable: true,
        duration: 2000,
      });
      setIsDialogOpen(false);
      handleRefreshData();
    }
  };

  const isFormChanged = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return Object.entries(formData).some(
      ([key, value]) => value !== initialData[key as keyof WorkType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return WORK_FORM_SCHEMA.every((f) => {
      const current = formData[f.key] ?? '';
      const initial = initialData[f.key] ?? '';
      if (current === initial) {
        return true;
      }
      return validateForm(f, current);
    });
  }, [formData, initialData]);

  const masterCollection = useMemo(
    () =>
      createListCollection({
        items: masters.map((master) => ({
          label: master.name,
          value: String(master.id_master),
        })),
      }),
    [masters],
  );

  return (
    <Stack
      gap={0}
      flexShrink={0}
      backgroundColor="white"
      overflow="hidden"
      rounded="xl"
      {...containerProps}
    >
      <Flex
        px={5}
        py={4}
        align="center"
        direction="row"
        justify="space-between"
        borderBottomWidth={isDataExists ? '1px' : undefined}
      >
        <Flex direction="column">
          <Text textStyle="xl" fontWeight="medium">
            Список работ
          </Text>
          <Text textStyle="md" color="gray.500">
            Всего записей: {works.length}
          </Text>
        </Flex>
        <CreateWork data={data} onCreate={handleRefreshData} />
      </Flex>
      {isDataExists && (
        <>
          <Table.ScrollArea maxH={500} w="100%">
            <Table.Root size="md" stickyHeader interactive>
              <Table.Header>
                <Table.Row bg="gray.100">
                  {WORK_TABLE_COLUMNS.map((col) => (
                    <Table.ColumnHeader key={col.key} textAlign="start">
                      {col.label}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {works.map((work, index) => {
                  const isLast = index === works.length - 1;
                  return (
                    <Table.Row
                      cursor="pointer"
                      key={work.id_work}
                      onDoubleClick={() => handleTableItemClick(work)}
                    >
                      {WORK_TABLE_COLUMNS.map((col) => (
                        <Table.Cell
                          key={col.key}
                          textAlign="start"
                          wordBreak="normal"
                          whiteSpace="normal"
                          borderBottom={isLast ? 0 : undefined}
                        >
                          {work[col.key] ?? '-'}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table.Root>
          </Table.ScrollArea>
          <Flex p={5} flexShrink={0} justify="flex-end" borderTopWidth="1px">
            <Flex direction="row" align="center" gap={3}>
              <Text textStyle="lg">Итого:</Text>
              <Stack borderWidth={1} px={3}>
                <Text textStyle="lg" fontWeight="medium">
                  {formatCurrency(totalWorksCost)}
                </Text>
              </Stack>
            </Flex>
          </Flex>
        </>
      )}
      {!!formData && (
        <Modal
          title="Редактирование записи"
          isOpen={isDialogOpen}
          onOpen={setIsDialogOpen}
          bodyLayout={
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {WORK_FORM_SCHEMA.map(
                ({ key, label, type, required, maxLength, disabled, fullWidth }) => {
                  if (!formData) {
                    return;
                  }

                  const value = formData[key] ?? '';
                  const placeholder = required ? 'Обязательное поле' : 'Необязательное поле';
                  const isInvalid = invalidFields.has(key);

                  let formItem;

                  if (type === 'select' && key === 'id_master') {
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
                          collection={masterCollection}
                          value={value ? [value] : []}
                          onValueChange={(details) => handleChange(key, details.value[0])}
                          positioning={{ strategy: 'fixed', hideWhenDetached: true }}
                        >
                          <Select.HiddenSelect />
                          <Select.Control>
                            <Select.Trigger>
                              <Select.ValueText placeholder="Выберите мастера..." />
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
                              {masterCollection.items.map((item) => (
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
          }
          footerLayout={
            <Flex gap={5} justify="space-between" w="full">
              <Button variant="subtle" colorPalette="red" onClick={handleDelete}>
                Удалить
              </Button>
              <Flex gap={3} align="center">
                <Button
                  variant="outline"
                  rounded="lg"
                  disabled={!isFormChanged}
                  onClick={handleReset}
                >
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
          }
        />
      )}
    </Stack>
  );
};
