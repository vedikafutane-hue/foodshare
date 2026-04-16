import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigate } from "@tanstack/react-router";
import { Leaf, Loader2 } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useAuth } from "../hooks/useAuth";
import type { RegisterFormData } from "../types";
import { UserRole } from "../types";

const roleOptions: { value: UserRole; label: string; desc: string }[] = [
  {
    value: UserRole.donor,
    label: "Donor",
    desc: "I donate surplus food from events, hotels, or restaurants",
  },
  {
    value: UserRole.ngo,
    label: "NGO / Charity",
    desc: "We receive food donations for our beneficiaries",
  },
  {
    value: UserRole.deliveryAgent,
    label: "Delivery Agent",
    desc: "I pick up and deliver food donations",
  },
  {
    value: UserRole.admin,
    label: "Admin",
    desc: "I manage the platform and users",
  },
];

const roleRoutes: Record<UserRole, string> = {
  [UserRole.donor]: "/donor",
  [UserRole.ngo]: "/ngo",
  [UserRole.deliveryAgent]: "/agent",
  [UserRole.admin]: "/admin",
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const {
    isAuthenticated,
    profile,
    register: registerUser,
    isRegistering,
    actorFetching,
  } = useAuth();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    defaultValues: { role: UserRole.donor },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    if (profile) {
      navigate({ to: roleRoutes[profile.role] });
    }
  }, [profile, navigate]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await registerUser(data);
      toast.success("Welcome to FoodShare!");
    } catch (err) {
      console.error("Registration error:", err);
      toast.error("Registration failed. Please try again.");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-background px-4 py-12"
      data-ocid="register.page"
    >
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <span className="font-display text-2xl font-bold">FoodShare</span>
        </div>

        <div className="card-elevated p-6 sm:p-8">
          <h1 className="font-display text-2xl font-bold mb-1">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            Tell us about yourself to get started.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Your full name"
                data-ocid="register.name_input"
                {...register("name", { required: "Name is required" })}
              />
              {errors.name && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="register.name_field_error"
                >
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+91 98765 43210"
                data-ocid="register.phone_input"
                {...register("phone", { required: "Phone is required" })}
              />
              {errors.phone && (
                <p
                  className="text-xs text-destructive"
                  data-ocid="register.phone_field_error"
                >
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="orgName">Organisation Name (optional)</Label>
              <Input
                id="orgName"
                placeholder="Hotel / NGO / Company name"
                data-ocid="register.orgname_input"
                {...register("orgName")}
              />
            </div>

            <div className="space-y-2">
              <Label>I am a…</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(v) => setValue("role", v as UserRole)}
                data-ocid="register.role_select"
              >
                {roleOptions.map((opt) => (
                  <label
                    key={opt.value}
                    htmlFor={`role-${opt.value}`}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-smooth cursor-pointer ${
                      selectedRole === opt.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem
                      value={opt.value}
                      id={`role-${opt.value}`}
                      className="mt-0.5"
                      data-ocid={`register.role_${opt.value}`}
                    />
                    <div>
                      <span className="font-semibold text-sm">{opt.label}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="btn-primary w-full"
              disabled={isRegistering || actorFetching}
              data-ocid="register.submit_button"
            >
              {isRegistering && (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              )}
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
