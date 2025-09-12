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
import { useEffect, useMemo, useState } from 'react';

import {
  deleteMaster,
  getMastersCount,
  getMastersList,
  MASTER_FORM_SCHEMA,
  MASTER_TABLE_COLUMNS,
  type MasterType,
  updateMaster,
} from '@/entities';
import { isDefined, validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

import { CreateMaster } from './createMaster';

interface IMasterListProps {
  containerProps?: StackProps;
}

type FormData = Record<keyof MasterType, string>;

export function MasterList({ containerProps }: IMasterListProps) {
  const [count, setCount] = useState(0);
  const [masters, setMasters] = useState<MasterType[]>([]);
  const [selectedMaster, setSelectedMaster] = useState<MasterType | null>(null);

  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    updateMasterData();
  }, []);

  const updateMasterData = () => {
    Promise.all([getMastersList(), getMastersCount()]).then(([data, total]) => {
      setMasters(data ?? []);
      setCount(total ?? 0);
    });
  };

  const handleTableItemClick = async (master: MasterType) => {
    const normalizedData = Object.fromEntries(
      Object.entries(master).map(([k, v]) => [k, v ?? '']),
    ) as FormData;

    setSelectedMaster(master);
    setFormData(normalizedData);
    setInitialData(normalizedData);
    setInvalidFields(new Set());
    setIsDialogOpen(true);
  };

  const handleChange = (key: keyof MasterType, value: string) => {
    const schema = MASTER_FORM_SCHEMA.find((f) => f.key === key);

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
    if (!formData || !selectedMaster || !isFormValid) {
      return;
    }

    const diff: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== initialData?.[key as keyof MasterType]) {
        diff[key] = value;
      }
    }

    const result = await updateMaster(selectedMaster.id_master, diff as { name: string });
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись мастера успешно обновлена',
      });
      setIsDialogOpen(false);
      updateMasterData();
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setInvalidFields(new Set());
  };

  const handleDelete = async () => {
    if (!selectedMaster) {
      return;
    }

    const result = await deleteMaster(selectedMaster.id_master);
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись мастера успешно удалена',
      });
      setIsDialogOpen(false);
      updateMasterData();
    }
  };

  const isFormChanged = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return Object.entries(formData).some(
      ([key, value]) => value !== initialData[key as keyof MasterType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return MASTER_FORM_SCHEMA.every((f) => {
      const current = formData[f.key] ?? '';
      const initial = initialData[f.key] ?? '';
      if (current === initial) {
        return true;
      }
      return validateForm(f, current);
    });
  }, [formData, initialData]);

  const isMastersExists = isDefined(masters) && masters.length > 0;

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
        borderBottomWidth={isMastersExists ? '1px' : undefined}
      >
        <Flex direction="column">
          <Text textStyle="xl" fontWeight="medium">
            Список мастеров
          </Text>
          <Text textStyle="md" color="gray.500">
            Всего записей: {count}
          </Text>
        </Flex>
        <CreateMaster onCreate={updateMasterData} />
      </Flex>
      {!!isMastersExists && (
        <Table.ScrollArea maxH={500} w="100%">
          <Table.Root size="md" stickyHeader interactive>
            <Table.Header>
              <Table.Row bg="gray.100">
                {MASTER_TABLE_COLUMNS.map((col) => (
                  <Table.ColumnHeader key={col.key} textAlign="start">
                    {col.label}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {masters.map((master, index) => {
                const isLast = index === masters.length - 1;
                return (
                  <Table.Row
                    cursor="pointer"
                    key={master.id_master}
                    onDoubleClick={() => handleTableItemClick(master)}
                  >
                    {MASTER_TABLE_COLUMNS.map((col) => (
                      <Table.Cell
                        key={col.key}
                        textAlign="start"
                        wordBreak="normal"
                        whiteSpace="normal"
                        borderBottom={isLast ? 0 : undefined}
                      >
                        {master[col.key] ?? '-'}
                      </Table.Cell>
                    ))}
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      )}
      {!!formData && (
        <Modal
          title="Редактирование записи"
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
}
