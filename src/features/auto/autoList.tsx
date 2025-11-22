import {
  Badge,
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

import type { AutoType, ExtClientType } from '@/entities';
import {
  AUTO_FORM_SCHEMA,
  getAutoName,
  getAutoPlateNumber,
  getAutoVin,
  updateAuto,
} from '@/entities/auto';
import { validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

import { CreateAuto } from './createAuto';

interface IAutoListProps {
  data: ExtClientType;
  handleRefreshData: () => void;
  containerProps?: StackProps;
}

type FormData = Record<keyof AutoType, string>;

export const AutoList = ({ data, handleRefreshData, containerProps }: IAutoListProps) => {
  const { id_client, autos = [] } = data;
  const [selectedAuto, setSelectedAuto] = useState<AutoType | null>(null);

  const [formData, setFormData] = useState<FormData | null>(null);
  const [initialData, setInitialData] = useState<FormData | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleItemDoubleClick = async (auto: AutoType) => {
    const normalizedData = Object.fromEntries(
      Object.entries(auto).map(([k, v]) => [k, v ?? '']),
    ) as FormData;

    setSelectedAuto(auto);
    setFormData(normalizedData);
    setInitialData(normalizedData);
    setInvalidFields(new Set());
    setIsDialogOpen(true);
  };

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

  const handleSave = async () => {
    if (!formData || !selectedAuto || !isFormValid) {
      return;
    }

    const diff: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      if (value !== initialData?.[key as keyof AutoType]) {
        diff[key] = value;
      }
    }

    const result = await updateAuto(selectedAuto.id_auto, diff);
    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись авто успешно обновлена',
      });
      setIsDialogOpen(false);
      handleRefreshData();
    }
  };

  const handleReset = () => {
    setFormData(initialData);
    setInvalidFields(new Set());
  };

  // const handleDelete = async () => {
  //   if (!selectedAuto) {
  //     return;
  //   }

  //   const result = await deleteAuto(selectedAuto.id_auto);
  //   if (result) {
  //     toaster.create({
  //       type: 'success',
  //       closable: true,
  //       duration: 2000,
  //       title: 'Запись авто успешно удалена',
  //     });
  //     setIsDialogOpen(false);
  //     handleRefreshData();
  //   }
  // };

  const isFormChanged = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return Object.entries(formData).some(
      ([key, value]) => value !== initialData[key as keyof AutoType],
    );
  }, [formData, initialData]);

  const isFormValid = useMemo(() => {
    if (!formData || !initialData) {
      return false;
    }
    return AUTO_FORM_SCHEMA.every((f) => {
      const currentValue = formData[f.key];
      const initialValue = initialData[f.key];
      if (currentValue === initialValue) {
        return true;
      }
      return validateForm(f, currentValue ?? '');
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
        <Flex direction="column">
          <Text textStyle="xl" fontWeight="medium">
            Список автомобилей
          </Text>
          <Text textStyle="md" color="gray.500">
            Всего записей: {autos.length}
          </Text>
        </Flex>
      </Flex>
      <Grid px={5} py={5} gap={4} templateColumns="repeat(2, 1fr)" autoRows="max-content">
        {autos?.map((auto) => {
          return (
            <GridItem colSpan={1} key={auto.id_auto}>
              <Stack
                p={5}
                rounded="xl"
                cursor="pointer"
                borderWidth={1}
                borderColor="gray.300"
                backgroundColor="gray.100"
                transition="all 0.15s ease-in-out"
                _hover={{ backgroundColor: '#ececef' }}
                onDoubleClick={() => handleItemDoubleClick(auto)}
              >
                <Flex direction="column" justify="space-between" gap={3}>
                  <Flex direction="row" align="baseline" justify="space-between" gap={3}>
                    <Text textStyle="lg" fontWeight="medium">
                      {getAutoName(auto)}
                    </Text>
                    <Badge colorPalette="blue" size="lg">
                      #{auto.id_auto}
                    </Badge>
                  </Flex>
                  <Flex align="center" gap={2}>
                    <img src="./vin-icon.svg" alt="VIN" width={22} />
                    <Text textStyle="md" color="gray.500" lineHeight="22px">
                      {getAutoVin(auto)}
                    </Text>
                  </Flex>
                  <Flex
                    py={2}
                    ps={2}
                    pe={3}
                    gap={2}
                    w="fit"
                    rounded="lg"
                    borderWidth="1px"
                    align="center"
                    justify="space-between"
                    backgroundColor="white"
                  >
                    <Flex direction="column" w="20px" borderWidth={1} rounded="sm">
                      <Stack w="100%" h="5px" backgroundColor="white"></Stack>
                      <Stack w="100%" h="5px" backgroundColor="blue"></Stack>
                      <Stack w="100%" h="5px" backgroundColor="red"></Stack>
                    </Flex>
                    <Text textStyle="sm">{getAutoPlateNumber(auto)}</Text>
                  </Flex>
                </Flex>
              </Stack>
            </GridItem>
          );
        })}
        <GridItem colSpan={1}>
          <CreateAuto clientId={id_client} onCreate={handleRefreshData} />
        </GridItem>
      </Grid>
      {!!formData && (
        <Modal
          title="Редактирование записи"
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
            <Flex gap={5} justify="flex-end" w="full">
              {/* <Button variant="subtle" colorPalette="red" onClick={handleDelete}>
                Удалить
              </Button> */}
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
