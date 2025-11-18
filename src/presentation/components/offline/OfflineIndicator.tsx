import React from 'react';
import { Box } from '@mui/material';
import styled from 'styled-components';
import { Wifi, WifiOff } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const OfflineIndicatorBar = styled(Box) <{ $show: boolean }>`
  display: ${(props) => (props.$show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  background: linear-gradient(135deg, #ff6b6b, #ff8c42);
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const OnlineIndicatorBar = styled(Box) <{ $show: boolean }>`
  display: ${(props) => (props.$show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 36px;
  background: linear-gradient(135deg, #51cf66, #40c057);
  color: white;
  font-size: 14px;
  font-weight: 500;
  padding: 0 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideDown 0.3s ease-out;

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

interface OfflineIndicatorProps {
    isOnline: boolean;
    wasOffline?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({ isOnline, wasOffline = false }) => {
    const { t } = useTranslation();

    // Show offline message when offline
    if (!isOnline) {
        return (
            <OfflineIndicatorBar $show={true} role="status" aria-live="polite">
                <WifiOff fontSize="small" />
                <span>{t('offline.youAreOffline')}</span>
            </OfflineIndicatorBar>
        );
    }

    // Show brief "back online" message when reconnecting
    if (wasOffline && isOnline) {
        return (
            <OnlineIndicatorBar $show={true} role="status" aria-live="polite">
                <Wifi fontSize="small" />
                <span>{t('offline.backOnline')}</span>
            </OnlineIndicatorBar>
        );
    }

    return null;
};
