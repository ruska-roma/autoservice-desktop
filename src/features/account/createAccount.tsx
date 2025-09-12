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
  Span,
  Stack,
} from '@chakra-ui/react';
import { useMemo, useState } from 'react';
import { PiPlusDuotone } from 'react-icons/pi';
import { useNavigate } from 'react-router';

import {
  ACCOUNT_FORM_SCHEMA,
  type AccountType,
  createAccount,
  type ExtClientType,
  getAutoName,
  getAutoVin,
} from '@/entities';
import { SCREENS } from '@/shared/config';
import { getTodayISO, isDefined, validateForm } from '@/shared/lib';
import { Modal, toaster } from '@/shared/ui';

interface ICreateAccountProps {
  client: ExtClientType;
}

type FormData = Record<keyof AccountType, string>;

export const CreateAccount = ({ client }: ICreateAccountProps) => {
  const { id_client, autos } = client;

  const navigate = useNavigate();

  const [isAutoSelected, setIsAutoSelected] = useState(false);
  const [selectedAutoId, setSelectedAutoId] = useState<number | null>(null);

  const [formData, setFormData] = useState<FormData>(
    () =>
      ({
        date: getTodayISO(),
      }) as FormData,
  );
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleReset = () => {
    setFormData(
      (prev) =>
        ({
          date: prev?.date ?? getTodayISO(),
        }) as FormData,
    );
    setInvalidFields(new Set());
  };

  const handleChange = (key: keyof AccountType, value: string) => {
    const schema = ACCOUNT_FORM_SCHEMA.find((f) => f.key === key);

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
    if (!isFormValid || !selectedAutoId || !isDefined(formData.date)) {
      return;
    }

    const result = await createAccount({
      ...formData,
      id_auto: selectedAutoId,
    });

    if (result) {
      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Запись счета успешно добавлена',
      });
      setIsDialogOpen(false);
      navigate(`/account/${result.id_account}`, {
        state: { fromPage: SCREENS.ClientDetails, clientId: id_client },
      });
    }
  };

  const isFormChanged = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { date, ...data } = formData;
    return Object.values(data).some((v) => v.trim().length > 0);
  }, [formData]);

  const isFormValid = useMemo(() => {
    return ACCOUNT_FORM_SCHEMA.every((f) => validateForm(f, formData[f.key] ?? ''));
  }, [formData]);

  const autoCollection = useMemo(
    () =>
      createListCollection({
        items: autos.map((auto) => ({
          label: getAutoName(auto),
          value: String(auto.id_auto),
          description: getAutoVin(auto),
        })),
      }),
    [autos],
  );

  return (
    <>
      <Button
        size="md"
        colorPalette="blue"
        rounded="lg"
        onClick={() => {
          handleReset();
          setIsAutoSelected(false);
          setSelectedAutoId(null);
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
          isAutoSelected ? (
            <Grid templateColumns="repeat(2, 1fr)" gap={4}>
              {ACCOUNT_FORM_SCHEMA.map(
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
          ) : (
            <Select.Root
              collection={autoCollection}
              value={selectedAutoId ? [String(selectedAutoId)] : []}
              onValueChange={(details) => {
                const id = Number(details.value[0]);
                setSelectedAutoId(id);
              }}
              positioning={{ strategy: 'fixed', hideWhenDetached: true }}
              maxW={464}
              w="full"
            >
              <Select.HiddenSelect />
              <Select.Control>
                <Select.Trigger>
                  <Select.ValueText placeholder="Выберите авто..." />
                </Select.Trigger>
                <Select.IndicatorGroup>
                  <Select.Indicator />
                </Select.IndicatorGroup>
              </Select.Control>
              <Select.Positioner w="full" maxW={464}>
                <Select.Content rounded="lg" w="full" maxW={464} maxH={200}>
                  {autoCollection.items.map((item) => (
                    <Select.Item item={item} key={item.value} rounded="md">
                      <Stack w="full" gap="0">
                        <Flex justify="space-between" gap={2} align="baseline">
                          <Select.ItemText>{item.label}</Select.ItemText>
                          <Badge colorPalette="blue" size="xs">
                            #{item.value}
                          </Badge>
                        </Flex>
                        <Span color="fg.muted" textStyle="xs">
                          {item.description}
                        </Span>
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
          isAutoSelected ? (
            <Flex justify="space-between" align="center" gap={5} w="100%">
              <Button
                rounded="lg"
                onClick={() => {
                  setIsAutoSelected(false);
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
              disabled={!selectedAutoId}
              onClick={() => setIsAutoSelected(true)}
            >
              Продолжить
            </Button>
          )
        }
      />
    </>
  );
};
