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
import { SHA256 } from 'crypto-js';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { getSettingsDetails, type SettingsType, updateSettings } from '@/entities';
import { SubmitButton } from '@/features';
import { PASSWORD_LENGHT, SCREENS } from '@/shared/config';
import { useAuth } from '@/shared/context';

interface IEditSecurityProps {
  containerProps?: StackProps;
}

export function EditSecurity({ containerProps }: IEditSecurityProps) {
  const [value, setValue] = useState('');
  const [initialValue, setInitialValue] = useState<string | null>(null);
  const [isInvalid, setIsInvalid] = useState(false);

  const navigate = useNavigate();
  const { setIsAuth } = useAuth();

  useEffect(() => {
    getSettingsDetails().then((settings: SettingsType | null) => {
      if (settings) {
        setInitialValue(settings.pass_hash);
      }
    });
  }, []);

  const validateFormValue = (val: string): boolean => {
    if (val.length !== PASSWORD_LENGHT || !/^\d+$/.test(val)) {
      return false;
    }
    const resolvedValue = SHA256(val).toString();
    return resolvedValue !== initialValue;
  };

  const handleSave = async () => {
    if (!validateFormValue(value)) {
      setIsInvalid(true);
      return;
    }

    const resolvedValue = SHA256(value.trim()).toString();
    const result = await updateSettings({ pass_hash: resolvedValue });
    if (result) {
      setIsAuth(false);
      navigate(SCREENS.Login);
    }
  };

  const handleReset = () => {
    setValue('');
    setIsInvalid(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const onlyDigitsValue = e.target.value.replace(/\D/g, '').slice(0, PASSWORD_LENGHT);
    setValue(onlyDigitsValue);
    setIsInvalid(!validateFormValue(onlyDigitsValue));
  };

  const isFormValid = validateFormValue(value);
  const isChanged = value.length > 0;

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
          Безопасность
        </Text>
      </Flex>
      <Grid px={5} py={4} gap={4} templateColumns="repeat(2, 1fr)">
        <GridItem colSpan={2}>
          <Field.Root required invalid={isInvalid}>
            <Field.Label>
              Новый пароль <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="password"
              outline="none"
              placeholder="*****"
              value={value}
              onChange={handleChange}
              maxLength={PASSWORD_LENGHT}
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
