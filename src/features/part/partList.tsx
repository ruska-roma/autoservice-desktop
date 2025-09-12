import {
  Button,
  Field,
  Flex,
  Grid,
  GridItem,
  Input,
  Stack,
  type StackProps,
  Table,
  Text,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';

import {
  type AccountDetailsType,
  deletePart,
  EDIT_PART_FORM_SCHEMA,
  PART_TABLE_COLUMNS,
  type PartType,
  updatePart,
} from '@/entities';
import { formatCurrency, validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

import { CreatePart } from './createPart';

interface IPartListProps {
  data: AccountDetailsType;
  isDataExists: boolean;
  totalPartsCost: number;
  containerProps?: StackProps;
  handleRefreshData: () => void;
}

type FormData = Record<keyof PartType, string>;

export const PartList = ({
  data,
  isDataExists,
  totalPartsCost,
  containerProps,
  handleRefreshData,
}: IPartListProps) => {
  const { parts, works } = data;

  const [selectedPart, setSelectedPart] = useState<PartType | null>(null);

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

  const handleTableItemClick = async (part: PartType) => {
    const normalizedData = Object.fromEntries(
      Object.entries(part).map(([k, v]) => {
        const schema = EDIT_PART_FORM_SCHEMA.find((f) => f.key === k);
        return [k, formatValue(schema?.mask, String(v ?? ''))];
      }),
    ) as FormData;

    setSelectedPart(part);
    setFormData(normalizedData);
    setInitialData(normalizedData);
    setInvalidFields(new Set());
    setIsDialogOpen(true);
  };

  const handleChange = (key: keyof PartType, rawValue: string) => {
    const schema = EDIT_PART_FORM_SCHEMA.find((f) => f.key === key);
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

  const handleReset = () => {
    setFormData(initialData);
    setInvalidFields(new Set());
  };

  const handleSave = async () => {
    if (!formData || !selectedPart || !isFormValid) {
      return;
    }

    const diff: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(formData)) {
      if (value === initialData?.[key as keyof PartType]) {
        continue;
      }

      switch (key) {
        case 'description':
          diff[key] = value.trim() || 'Без названия';
          break;

        case 'part_unit':
          diff[key] = value || 'шт.';
          break;

        case 'part_count':
          diff[key] = value ? Number(value.replace(',', '.')) : 0;
          break;

        case 'part_cost':
          diff[key] = value ? Number(value.replace(/\s/g, '').replace(',', '.')) : 0;
          break;

        case 'discount':
          diff[key] = value ? Number(value) / 100 : 0;
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

    const result = await updatePart(selectedPart.id_part, diff);
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись запчасти успешно обновлена',
      });
      setIsDialogOpen(false);
      handleRefreshData();
    }
  };

  const handleDelete = async () => {
    if (!selectedPart) {
      return;
    }

    const result = await deletePart(selectedPart.id_part);
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись запчасти успешно удалена',
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
      ([key, value]) => value !== initialData[key as keyof PartType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return EDIT_PART_FORM_SCHEMA.every((f) => {
      const current = formData[f.key] ?? '';
      const initial = initialData[f.key] ?? '';
      if (current === initial) {
        return true;
      }
      return validateForm(f, current);
    });
  }, [formData, initialData]);

  const isWorksExists = works.length > 0;

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
            Список запчастей
          </Text>
          <Text textStyle="md" color="gray.500">
            Всего записей: {parts.length}
          </Text>
        </Flex>
        {!!isWorksExists && <CreatePart data={data} onCreate={handleRefreshData} />}
      </Flex>
      {!!isDataExists && (
        <>
          <Table.ScrollArea maxH={500} w="100%">
            <Table.Root size="md" stickyHeader interactive>
              <Table.Header>
                <Table.Row bg="gray.100">
                  {PART_TABLE_COLUMNS.map((col) => (
                    <Table.ColumnHeader key={col.key} textAlign="start">
                      {col.label}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {parts.map((part, index) => {
                  const isLast = index === parts.length - 1;
                  return (
                    <Table.Row
                      cursor="pointer"
                      key={part.id_work}
                      onDoubleClick={() => handleTableItemClick(part)}
                    >
                      {PART_TABLE_COLUMNS.map((col) => (
                        <Table.Cell
                          key={col.key}
                          textAlign="start"
                          wordBreak="normal"
                          whiteSpace="normal"
                          borderBottom={isLast ? 0 : undefined}
                        >
                          {part[col.key] ?? '-'}
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
                  {formatCurrency(totalPartsCost)}
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
              {EDIT_PART_FORM_SCHEMA.map(
                ({ key, label, type, required, maxLength, disabled, fullWidth }) => {
                  if (!formData) {
                    return;
                  }

                  const value = formData[key] ?? '';
                  const placeholder = required ? 'Обязательное поле' : 'Необязательное поле';
                  const isInvalid = invalidFields.has(key);

                  const formItem = (
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
