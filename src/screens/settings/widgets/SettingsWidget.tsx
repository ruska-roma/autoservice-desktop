import {
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
import { useEffect, useState } from 'react';

import { getSettingsDetails, type SettingsType, updateSettings } from '@/entities';
import { SubmitButton } from '@/features';
import { toaster } from '@/shared/ui';

interface ISettingsWidgetProps {
  containerProps?: StackProps;
}

export function SettingsWidget({ containerProps }: ISettingsWidgetProps) {
  const [value, setValue] = useState('');
  const [initialValue, setInitialValue] = useState<number | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    getSettingsDetails().then((settings: SettingsType | null) => {
      if (settings) {
        setInitialValue(settings.standard_hour);
        setValue(String(settings.standard_hour));
      }
    });
  }, []);

  const validateFormValue = (val: string): boolean => {
    if (val.trim() === '') {
      return false;
    }
    const resolved = Number(val);
    return Number.isFinite(resolved) && resolved > 0;
  };

  const handleReset = () => {
    setValue(initialValue !== null ? String(initialValue) : '');
    setIsInvalid(false);
  };

  const handleSave = async () => {
    if (!validateFormValue(value)) {
      setIsInvalid(true);
      return;
    }

    const resolvedValue = Number(value.trim());
    const result = await updateSettings({ standard_hour: resolvedValue });
    if (result) {
      setInitialValue(resolvedValue);
      setValue(String(resolvedValue));
      setIsInvalid(false);

      toaster.create({
        type: 'success',
        closable: true,
        duration: 2000,
        title: 'Данные показателей успешно обновлены',
      });
    }
  };

  const isFormValid = validateFormValue(value);
  const isChanged = initialValue !== null && String(initialValue) !== value;

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
        borderBottomWidth="1px"
      >
        <Text textStyle="xl" fontWeight="medium">
          Расчётные показатели
        </Text>
      </Flex>
      <Grid px={5} py={4} gap={4} templateColumns="repeat(2, 1fr)">
        <GridItem colSpan={2}>
          <Field.Root required invalid={isInvalid}>
            <Field.Label>
              Нормо-час, ₽ <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="text"
              outline="none"
              value={value}
              maxLength={10}
              onChange={(e) => {
                const onlyDigitsValue = e.target.value.replace(/[^0-9.]/g, '').slice(0, 10);
                setValue(onlyDigitsValue);
                setIsInvalid(!validateFormValue(onlyDigitsValue));
              }}
              placeholder="Введите сумму"
            />
          </Field.Root>
        </GridItem>
      </Grid>
      <Flex justify="flex-end" px={5} pb={5} gap={3}>
        <Button variant="outline" rounded="lg" disabled={!isChanged} onClick={handleReset}>
          Отмена
        </Button>
        <SubmitButton
          disabled={!isChanged || !isFormValid}
          onConfirm={handleSave}
          beforeConfirm={() => validateFormValue(value)}
        >
          Сохранить
        </SubmitButton>
      </Flex>
    </Stack>
  );
}
