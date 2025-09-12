import {
  Button,
  createListCollection,
  Field,
  Flex,
  Grid,
  GridItem,
  Input,
  Select,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { PiPlusDuotone } from 'react-icons/pi';

import {
  type AccountDetailsType,
  createWork,
  getMastersList,
  getSettingsDetails,
  type MasterType,
  type SettingsType,
  WORK_FORM_SCHEMA,
  type WorkType,
} from '@/entities';
import { getTodayISO, isDefined, validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

interface ICreateWorkProps {
  data: AccountDetailsType;
  onCreate: () => void;
}

type FormData = Record<keyof WorkType, string>;

export const CreateWork = ({ data, onCreate }: ICreateWorkProps) => {
  const { id_account } = data;

  const [masters, setMasters] = useState<MasterType[]>([]);
  const [settings, setSettings] = useState<SettingsType>();
  const [formData, setFormData] = useState<FormData>({} as FormData);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleButtonClick = async () => {
    handleReset();

    const [mastersData, settingsData] = await Promise.all([getMastersList(), getSettingsDetails()]);

    if (!mastersData || mastersData.length === 0) {
      toaster.create({
        type: 'error',
        closable: true,
        title: 'Невозможно создать запись',
        description: 'Список мастеров пуст. Добавьте хотя бы одного мастера.',
      });
      return;
    }

    if (!isDefined(settingsData) || !isDefined(settingsData.standard_hour)) {
      toaster.create({
        type: 'error',
        closable: true,
        title: 'Невозможно создать запись',
        description: 'Расчетные показатели недоступны. Проверьте их в разделе "Организация".',
      });
      return;
    }

    setMasters(mastersData);
    setSettings(settings);
    setFormData({
      ...formData,
      work_cost: String(settingsData.standard_hour),
      date: getTodayISO(),
    });
    setIsDialogOpen(true);
  };

  const handleReset = () => {
    setFormData(
      (prev) =>
        ({
          work_cost: prev?.work_cost ?? String(settings?.standard_hour),
        }) as FormData,
    );
    setInvalidFields(new Set());
  };

  const handleChange = (key: keyof WorkType, rawValue: string) => {
    const schema = WORK_FORM_SCHEMA.find((f) => f.key === key);
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
    if (!isFormValid || !id_account) {
      return;
    }

    const normalizeDate = (dateStr: string): string => {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) {
        return getTodayISO();
      }
      return d.toISOString().split('T')[0];
    };

    const result = await createWork({
      ...formData,
      id_account: id_account,
      id_master: Number(formData.id_master) || null,
      description: formData.description?.trim() || 'Без названия',
      work_hours: formData.work_hours ? Number(formData.work_hours.replace(',', '.')) : 0,
      work_cost: formData.work_cost
        ? Number(formData.work_cost.replace(/\s/g, '').replace(',', '.'))
        : 0,
      discount: formData.discount ? Number(formData.discount) / 100 : 0,
      date: normalizeDate(formData.date),
    });

    if (result) {
      toaster.create({
        title: 'Запись работы успешно добавлена',
        type: 'success',
        closable: true,
        duration: 2000,
      });
      onCreate();
      setIsDialogOpen(false);
    }
  };

  const isFormChanged = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { work_cost, ...data } = formData;
    return Object.values(data).some((v) => v.trim().length > 0);
  }, [formData]);

  const isFormValid = useMemo(() => {
    return WORK_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  const masterCollection = useMemo(
    () =>
      createListCollection({
        items: masters.map((m) => ({
          label: m.name,
          value: String(m.id_master),
        })),
      }),
    [masters],
  );

  return (
    <>
      <Button size="md" colorPalette="blue" rounded="lg" onClick={handleButtonClick}>
        <PiPlusDuotone />
        Добавить
      </Button>
      <Modal
        title="Добавление записи"
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
          <Flex justify="flex-end" align="center" gap={5} w="100%">
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
        }
      />
    </>
  );
};
