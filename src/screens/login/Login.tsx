import { Flex, PinInput, Stack, Text, VStack } from '@chakra-ui/react';
import { SHA256 } from 'crypto-js';
import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';

import { getSettingsDetails, type SettingsType } from '@/entities/settings';
import { PASSWORD_LENGHT, SCREENS } from '@/shared/config';
import { useAuth } from '@/shared/context';
import { Container } from '@/shared/ui';

export function Login() {
  const navigate = useNavigate();
  const { isAuth, setIsAuth } = useAuth();

  const [isInvalid, setIsInvalid] = useState(false);

  const handleComplete = async (details: { valueAsString: string }) => {
    const inputHash = SHA256(details.valueAsString).toString();

    const settings: SettingsType | null = await getSettingsDetails();

    if (!settings?.pass_hash || inputHash !== settings.pass_hash) {
      setIsInvalid(true);
      return;
    }

    setIsAuth(true);
    navigate(SCREENS.ClientList);
  };

  if (isAuth) {
    return <Navigate to={SCREENS.ClientList} replace />;
  }

  return (
    <Container>
      <Flex justify="center" align="center" minH="100vh">
        <VStack backgroundColor="white" rounded="2xl" p={5}>
          <VStack textAlign="center" rowGap="15px" px={3} py={2}>
            <Stack mb={2} align="center">
              <img src="./logo.svg" alt="Autoservice Logo" width={220} />
            </Stack>
            <PinInput.Root
              mask
              size="xl"
              type="numeric"
              autoFocus
              selectOnFocus
              invalid={isInvalid}
              colorPalette="blue"
              onValueComplete={handleComplete}
            >
              <PinInput.HiddenInput />
              <PinInput.Control>
                {Array.from({ length: PASSWORD_LENGHT }).map((_, i) => (
                  <PinInput.Input key={i} index={i} />
                ))}
              </PinInput.Control>
            </PinInput.Root>
            <Text textStyle="md" color={isInvalid ? 'red.400' : 'gray.400'}>
              {isInvalid ? 'Неверный код доступа' : 'Пожалуйста, введите код доступа'}
            </Text>
          </VStack>
        </VStack>
      </Flex>
    </Container>
  );
}
