import type {SxProps, Theme} from "@mui/material/styles";

import React, {useEffect} from "react";

import Backdrop from "@mui/material/Backdrop";
import {CircularProgress} from "@mui/material";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";


type Props = {
  open?: boolean;
  blur?: number;
  messages?: string[] | string;
  children?: React.ReactNode;
  deep?: number;
  position?: 'absolute' | 'fixed' | 'relative'|'inherit'|'initial'|'unset';
  icon?: boolean,
  sx?:SxProps
}

const defaultStyles = {
  left: 0,
  width: '100%',
  height: '100%',
}

export function CustomBackdrop({open=true, blur=70,children, messages=[''], deep=1, position='absolute', icon=true, sx=defaultStyles}: Props) {
const [currentIndex, setCurrentIndex] = React.useState(0);

  useEffect(() => {
    if(currentIndex < messages!.length -1){
      const intervalId = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % messages!.length);
      }, 3000);

      return () => clearInterval(intervalId);
    }

    return undefined
  }, [currentIndex, messages]);

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: (mTheme: Theme) => deep,
        position,
        backdropFilter: `blur(${blur}px)`,
        background: 'rgba(255, 255, 255, 0.1)',
        ...sx

      }}
    >
      {children || (
        <Stack alignItems="center" gap={1}>
          {icon && <CircularProgress sx={{color: 'primary.main'}}/>}
          <Typography variant="subtitle2" component="div">
            {messages[currentIndex]}
          </Typography>
        </Stack>)}
    </Backdrop>
  );
}
