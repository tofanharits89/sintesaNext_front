'use client';

import * as React from 'react';
import * as AlertDialogPrimitive from '@radix-ui/react-alert-dialog';
import { AnimatePresence, motion, type HTMLMotionProps } from 'motion/react';

type AlertDialogContextType = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const AlertDialogContext = React.createContext<AlertDialogContextType | null>(null);

function useAlertDialog() {
  const context = React.useContext(AlertDialogContext);
  if (!context) {
    throw new Error('useAlertDialog must be used within an AlertDialog');
  }
  return context;
}

type AlertDialogProps = React.ComponentProps<typeof AlertDialogPrimitive.Root>;

function AlertDialog({ open, defaultOpen = false, onOpenChange, ...props }: AlertDialogProps) {
  const [isOpen, setIsOpenState] = React.useState(open ?? defaultOpen);

  React.useEffect(() => {
    if (open !== undefined) setIsOpenState(open);
  }, [open]);

  const setIsOpen = React.useCallback(
    (value: boolean) => {
      setIsOpenState(value);
      onOpenChange?.(value);
    },
    [onOpenChange],
  );

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen }}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        {...props}
        open={isOpen}
        onOpenChange={setIsOpen}
      />
    </AlertDialogContext.Provider>
  );
}

type AlertDialogTriggerProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Trigger
>;

function AlertDialogTrigger(props: AlertDialogTriggerProps) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  );
}

type AlertDialogPortalProps = Omit<
  React.ComponentProps<typeof AlertDialogPrimitive.Portal>,
  'forceMount'
>;

function AlertDialogPortal(props: AlertDialogPortalProps) {
  const { isOpen } = useAlertDialog();

  return (
    <AnimatePresence>
      {isOpen && (
        <AlertDialogPrimitive.Portal
          data-slot="alert-dialog-portal"
          forceMount
          {...props}
        />
      )}
    </AnimatePresence>
  );
}

type AlertDialogOverlayProps = Omit<
  React.ComponentProps<typeof AlertDialogPrimitive.Overlay>,
  'forceMount'
> &
  Omit<HTMLMotionProps<'div'>, 'ref'>;

const AlertDialogOverlay = React.forwardRef<HTMLDivElement, AlertDialogOverlayProps>(
  ({ className, transition = { duration: 0.2, ease: 'easeInOut' }, ...props }, ref) => {
    return (
      <AlertDialogPrimitive.Overlay forceMount asChild>
        <motion.div
          ref={ref}
          data-slot="alert-dialog-overlay"
          key="alert-dialog-overlay"
          initial={{ opacity: 0, filter: 'blur(4px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(4px)' }}
          transition={transition}
          className={className}
          {...props}
        />
      </AlertDialogPrimitive.Overlay>
    );
  },
);
AlertDialogOverlay.displayName = 'AlertDialogOverlay';

type AlertDialogFlipDirection = 'top' | 'bottom' | 'left' | 'right';

type AlertDialogContentProps = Omit<
  React.ComponentProps<typeof AlertDialogPrimitive.Content>,
  'forceMount'
> &
  Omit<HTMLMotionProps<'div'>, 'ref'> & {
    from?: AlertDialogFlipDirection;
  };

const AlertDialogContent = React.forwardRef<HTMLDivElement, AlertDialogContentProps>(
  (
    {
      from = 'top',
      onOpenAutoFocus,
      onCloseAutoFocus,
      onEscapeKeyDown,
      transition = { type: 'spring', stiffness: 150, damping: 25 },
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const initialRotation =
      from === 'bottom' || from === 'left' ? '20deg' : '-20deg';
    const isVertical = from === 'top' || from === 'bottom';
    const rotateAxis = isVertical ? 'rotateX' : 'rotateY';

    return (
      <AlertDialogPrimitive.Content
        forceMount
        {...(onOpenAutoFocus ? { onOpenAutoFocus } : {})}
        {...(onCloseAutoFocus ? { onCloseAutoFocus } : {})}
        {...(onEscapeKeyDown ? { onEscapeKeyDown } : {})}
        className={className}
        ref={ref}
        data-slot="alert-dialog-content"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        <motion.div
          key="alert-dialog-content"
          className={className}
          initial={{
            opacity: 0,
            filter: 'blur(4px)',
            transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
          }}
          animate={{
            opacity: 1,
            filter: 'blur(0px)',
            transform: `perspective(500px) ${rotateAxis}(0deg) scale(1)`,
          }}
          exit={{
            opacity: 0,
            filter: 'blur(4px)',
            transform: `perspective(500px) ${rotateAxis}(${initialRotation}) scale(0.8)`,
          }}
          transition={transition}
          {...props}
        >
          {children}
        </motion.div>
      </AlertDialogPrimitive.Content>
    );
  },
);
AlertDialogContent.displayName = 'AlertDialogContent';

type AlertDialogCancelProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Cancel
>;

function AlertDialogCancel(props: AlertDialogCancelProps) {
  return (
    <AlertDialogPrimitive.Cancel data-slot="alert-dialog-cancel" {...props} />
  );
}

type AlertDialogActionProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Action
>;

function AlertDialogAction(props: AlertDialogActionProps) {
  return (
    <AlertDialogPrimitive.Action data-slot="alert-dialog-action" {...props} />
  );
}

type AlertDialogHeaderProps = React.ComponentProps<'div'>;

function AlertDialogHeader(props: AlertDialogHeaderProps) {
  return <div data-slot="alert-dialog-header" {...props} />;
}

type AlertDialogFooterProps = React.ComponentProps<'div'>;

function AlertDialogFooter(props: AlertDialogFooterProps) {
  return <div data-slot="alert-dialog-footer" {...props} />;
}

type AlertDialogTitleProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Title
>;

function AlertDialogTitle(props: AlertDialogTitleProps) {
  return (
    <AlertDialogPrimitive.Title data-slot="alert-dialog-title" {...props} />
  );
}

type AlertDialogDescriptionProps = React.ComponentProps<
  typeof AlertDialogPrimitive.Description
>;

function AlertDialogDescription(props: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      {...props}
    />
  );
}

export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  useAlertDialog,
  type AlertDialogProps,
  type AlertDialogTriggerProps,
  type AlertDialogPortalProps,
  type AlertDialogCancelProps,
  type AlertDialogActionProps,
  type AlertDialogOverlayProps,
  type AlertDialogContentProps,
  type AlertDialogHeaderProps,
  type AlertDialogFooterProps,
  type AlertDialogTitleProps,
  type AlertDialogDescriptionProps,
  type AlertDialogContextType,
  type AlertDialogFlipDirection,
};
