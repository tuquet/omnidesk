import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { Label } from './label';
import { cn } from '../../lib/utils';

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('flex flex-col gap-2', className)} {...props} />;
  },
);
FormItem.displayName = 'FormItem';

const FormLabel = React.forwardRef<
  React.ElementRef<typeof Label>,
  React.ComponentPropsWithoutRef<typeof Label> & {
    required?: boolean;
  }
>(({ className, required, ...props }, ref) => {
  return (
    <Label
      ref={ref}
      className={cn(
        className,
        required && "after:content-['*'] after:ml-0.5 after:text-destructive",
      )}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  return <Slot ref={ref} {...props} />;
});
FormControl.displayName = 'FormControl';

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
});
FormDescription.displayName = 'FormDescription';

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    error?: any;
  }
>(({ className, children, error, ...props }, ref) => {
  const body = error ? String(error) : children;

  if (!body) {
    return null;
  }

  return (
    <p ref={ref} className={cn('text-sm font-medium text-destructive', className)} {...props}>
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

export { FormItem, FormLabel, FormControl, FormDescription, FormMessage };
