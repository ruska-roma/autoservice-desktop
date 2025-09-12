import { Button, CloseButton, Dialog, Flex, PinInput, Portal, Text } from '@chakra-ui/react';
import { SHA256 } from 'crypto-js';
import { type PropsWithChildren, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import { getSettingsDetails, type SettingsType } from '@/entities/settings';
import { MAX_SUBMIT_ATTEMPTS, PASSWORD_LENGHT, SCREENS } from '@/shared/config';
import { useAuth } from '@/shared/context';
import type { ButtonVariantEnum, SizeEnum } from '@/shared/types';

interface ISubmitButtonProps {
  size?: SizeEnum;
  rounded?: string;
  disabled?: boolean;
  colorPalette?: string;
  variant?: ButtonVariantEnum;
  description?: string;
  onConfirm: () => void;
  beforeConfirm?: () => boolean;
}

export function SubmitButton({
  children,
  size = 'md',
  rounded = 'lg',
  disabled = false,
  colorPalette = 'blue',
  variant = 'solid',
  description = 'Для совершения данного действия требуется подтверждение',
  onConfirm,
  beforeConfirm,
}: PropsWithChildren<ISubmitButtonProps>) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [isInvalid, setIsInvalid] = useState<boolean>(false);
  const [attemptCount, setAttemptCount] = useState<number>(0);

  const navigate = useNavigate();
  const { setIsAuth } = useAuth();

  useEffect(() => {
    if (!isDialogOpen) {
      setAttemptCount(0);
      setIsInvalid(false);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (attemptCount >= MAX_SUBMIT_ATTEMPTS) {
      setIsAuth(false);
      navigate(SCREENS.Login);
    }
  }, [attemptCount, setIsAuth, navigate]);

  const handlePinComplete = async (details: { valueAsString: string }) => {
    const inputHash = SHA256(details.valueAsString).toString();

    const settings: SettingsType | null = await getSettingsDetails();

    if (!settings?.pass_hash || inputHash !== settings.pass_hash) {
      setIsInvalid(true);
      setAttemptCount((prev) => prev + 1);
      return;
    }

    setIsInvalid(false);
    setAttemptCount(0);
    setIsDialogOpen(false);
    onConfirm();
  };

  const handleClick = () => {
    if (disabled) {
      return;
    }
    if (beforeConfirm && !beforeConfirm()) {
      return;
    }
    setIsDialogOpen(true);
  };

  return (
    <Dialog.Root
      size="xs"
      placement="center"
      motionPreset="slide-in-bottom"
      lazyMount
      open={isDialogOpen}
      onOpenChange={(state) => setIsDialogOpen(state.open)}
      closeOnEscape={false}
      closeOnInteractOutside={false}
    >
      <Button
        size={size}
        rounded={rounded}
        variant={variant}
        disabled={disabled}
        colorPalette={colorPalette}
        onClick={handleClick}
      >
        {children}
      </Button>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Flex
                direction="column"
                textAlign="center"
                justify="center"
                align="center"
                rowGap="8px"
                w="full"
              >
                <Dialog.Title>Требуется подтверждение</Dialog.Title>
                <Dialog.Description>{description}</Dialog.Description>
              </Flex>
            </Dialog.Header>
            <Dialog.Body
              display="flex"
              flexDirection="column"
              justifyContent="center"
              textAlign="center"
              rowGap="15px"
            >
              <PinInput.Root
                mask
                size="xl"
                selectOnFocus
                colorPalette="blue"
                display="flex"
                alignItems="center"
                justifyContent="center"
                invalid={isInvalid}
                onValueComplete={handlePinComplete}
              >
                <PinInput.HiddenInput />
                <PinInput.Control>
                  {Array.from({ length: PASSWORD_LENGHT }).map((_, i) => (
                    <PinInput.Input key={i} index={i} />
                  ))}
                </PinInput.Control>
              </PinInput.Root>
              <Text textStyle="sm" color={isInvalid ? 'red.400' : 'gray.400'}>
                {isInvalid
                  ? `Неверный код. Осталось попыток: ${3 - attemptCount}`
                  : 'Пожалуйста, введите код доступа'}
              </Text>
            </Dialog.Body>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
