import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-primary/40 group-[.toaster]:shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] group-[.toaster]:rounded-xl group-[.toaster]:border-2 group-[.toaster]:px-6 group-[.toaster]:py-4",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:border-primary group-[.toaster]:shadow-[0_0_30px_rgba(var(--primary-rgb),0.4)]",
          error: "group-[.toaster]:border-destructive group-[.toaster]:shadow-[0_0_30px_rgba(220,38,38,0.4)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
