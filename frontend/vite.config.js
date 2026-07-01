import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target:
          "http://student-management-alb-1419919567.eu-north-1.elb.amazonaws.com",
        changeOrigin: true,
      },
    },
  },
});
