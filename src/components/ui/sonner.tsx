import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      offset="35vh"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background/95 group-[.toaster]:backdrop-blur-xl group-[.toaster]:text-foreground group-[.toaster]:border-border/40 group-[.toaster]:shadow-lg group-[.toaster]:rounded-xl group-[.toaster]:border group-[.toaster]:px-4 group-[.toaster]:py-3 group-[.toaster]:text-sm group-[.toaster]:font-normal group-[.toaster]:min-w-[320px] group-[.toaster]:max-w-[420px]",
          description: "group-[.toast]:text-muted-foreground group-[.toast]:text-sm group-[.toast]:mt-1",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-md group-[.toast]:text-sm group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:font-medium group-[.toast]:hover:bg-primary/90 group-[.toast]:transition-colors",
          cancelButton:
            "group-[.toast]:bg-secondary group-[.toast]:text-secondary-foreground group-[.toast]:rounded-md group-[.toast]:text-sm group-[.toast]:px-3 group-[.toast]:py-1.5 group-[.toast]:hover:bg-secondary/80 group-[.toast]:transition-colors",
          success: "group-[.toaster]:border-primary/40 group-[.toaster]:bg-primary/5",
          error: "group-[.toaster]:border-destructive/40 group-[.toaster]:bg-destructive/5",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
