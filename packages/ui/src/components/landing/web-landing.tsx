import { Link } from '@tanstack/react-router';
import { Button } from '../../index';
import { ArrowRight, LayoutDashboard, Workflow, ShieldCheck } from 'lucide-react';

export function WebLanding() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-background relative overflow-y-auto overflow-x-hidden px-6 py-12 text-center">
      {/* Dynamic Background Gradients */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--muted)/0.5)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--muted)/0.5)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_40%,transparent_100%)]" />
      <div className="pointer-events-none absolute -top-1/4 -right-1/4 h-[40rem] w-[40rem] rounded-full bg-primary/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-1/4 -left-1/4 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
        {/* Logo Area */}
        <div className="mb-8 flex items-center justify-center animate-in zoom-in duration-500">
          <img
            src="/favicon.svg"
            alt="Flowup Logo"
            className="h-24 w-24 text-primary transition-transform duration-500 hover:scale-105"
            style={{ filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 0.3))' }}
          />
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl mb-6 bg-gradient-to-br from-foreground via-foreground to-foreground/60 bg-clip-text text-transparent">
          Welcome to Flowup
        </h1>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl leading-relaxed">
          The ultimate CRM and Business Automation platform. Empower your team with intelligent
          workflows, secure access, and a unified workspace in the cloud.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mb-20">
          <Button
            asChild
            size="lg"
            className="h-14 px-8 text-lg rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all group"
          >
            <Link to="/login">
              Sign In to Workspace
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="h-14 px-8 text-lg rounded-full backdrop-blur-sm hover:bg-muted/50 transition-all"
          >
            <Link to="/signup">Create Free Account</Link>
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left w-full max-w-4xl">
          <div className="flex flex-col p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <LayoutDashboard className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Unified CRM</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Manage all your customer data, sales pipelines, and interactions from a single,
              intuitive dashboard.
            </p>
          </div>

          <div className="flex flex-col p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Workflow className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Smart Automation</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Automate repetitive tasks and complex business workflows with our powerful
              drag-and-drop visual builder.
            </p>
          </div>

          <div className="flex flex-col p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Enterprise Security</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Granular role-based access control (RBAC) and enterprise-grade encryption keeps your
              business data safe.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
