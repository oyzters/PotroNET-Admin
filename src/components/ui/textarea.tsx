import * as React from "react"

function cn(...classes: (string | undefined | false | null)[]) {
    return classes.filter(Boolean).join(' ');
}

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
    return (
        <textarea
            className={cn(
                "flex min-h-[80px] w-full rounded-md border border-border bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        />
    );
}

export { Textarea };
