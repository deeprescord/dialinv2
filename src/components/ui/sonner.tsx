import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset="20vh"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gradient-to-br group-[.toaster]:from-background/60 group-[.toaster]:via-background/50 group-[.toaster]:to-background/40 group-[.toaster]:backdrop-blur-2xl group-[.toaster]:text-foreground group-[.toaster]:border-primary/50 group-[.toaster]:shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)] group-[.toaster]:rounded-2xl group-[.toaster]:border-2 group-[.toaster]:px-8 group-[.toaster]:py-6 group-[.toaster]:text-lg group-[.toaster]:font-medium group-[.toaster]:min-w-[400px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-base",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:text-base",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:text-base",
          success: "group-[.toaster]:border-primary group-[.toaster]:shadow-[0_0_50px_rgba(var(--primary-rgb),0.5)]",
          error: "group-[.toaster]:border-destructive group-[.toaster]:shadow-[0_0_50px_rgba(220,38,38,0.5)]",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
