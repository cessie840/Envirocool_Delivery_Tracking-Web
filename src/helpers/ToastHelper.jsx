import { Toaster, toast } from "sonner";

export const ToastHelper = {
  success: (message) =>
    toast.success(message, {
      duration: 2500,
      style: {
        background: "#EBFAECFF",
        border: "1px solid #91C793FF",
        color: "#2E7D32",
        fontWeight: 600,
        fontSize: "1.1rem",
        textAlign: "center",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        justifyContent: "center",
        borderRadius: "8px",
      },
    }),

  error: (message) =>
    toast.error(message, {
      duration: 2500,
      style: {
        background: "#FEECEC",
        border: "1px solid #E57373",
        color: "#B71C1C",
        fontWeight: 600,
        fontSize: "1.1rem",
        textAlign: "center",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        justifyContent: "center",
        borderRadius: "8px",
      },
    }),
  info: (message) =>
    toast(message, {
      duration: 2500,
      style: {
        background: "#E8F4FD",
        border: "1px solid #64B5F6",
        color: "#1565C0",
        fontWeight: 600,
        fontSize: "1.1rem",
        textAlign: "center",
        width: "100%",
        maxWidth: "600px",
        margin: "0 auto",
        justifyContent: "center",
        borderRadius: "8px",
      },
    }),
};
