"use client";

import Box from "@mui/material/Box";
import { motion } from "framer-motion";
import Image from "next/image";

import appIcon from "@/assets/icon.png";

const trail = [
  { size: 22, x: 46, y: -8, delay: 0, duration: 3.2, opacity: 0.35 },
  { size: 14, x: 74, y: -46, delay: 0.4, duration: 3.6, opacity: 0.25 },
  { size: 10, x: 30, y: -70, delay: 0.9, duration: 3, opacity: 0.3 },
  { size: 18, x: 88, y: -6, delay: 1.3, duration: 3.8, opacity: 0.18 },
  { size: 8, x: 58, y: -92, delay: 1.8, duration: 3.4, opacity: 0.22 },
];

export function HeroAnimation() {
  return (
    <Box aria-hidden sx={{ position: "relative", display: "flex", height: 96, width: 96, alignItems: "center", justifyContent: "center" }}>
      {trail.map((square, index) => (
        <Box
          component={motion.span}
          key={index}
          sx={{ position: "absolute", left: "50%", top: "50%", borderRadius: 1.5, bgcolor: "primary.main" }}
          style={{
            width: 40,
            height: 40,
            marginLeft: -square.size / 2,
            marginTop: -square.size / 2,
            opacity: 0,
          }}
          animate={{
            x: [0, square.x],
            y: [0, square.y],
            opacity: [0, square.opacity, 0],
            rotate: [0, 25],
          }}
          transition={{
            duration: square.duration,
            delay: square.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      <Box
        component={motion.span}
        sx={{ position: "relative", display: "flex", height: 320, width: 320, alignItems: "center", justifyContent: "center", borderRadius: 4 }}
        animate={{ y: [0, -6, 0], rotate: [-2, 2, -2] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image src={appIcon} alt="" width={120} height={120} style={{ borderRadius: 7 }} priority />
      </Box>
    </Box>
  );
}
