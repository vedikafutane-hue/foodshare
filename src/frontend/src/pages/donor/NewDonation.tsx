import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  ImageIcon,
  Loader2,
  MapPin,
  Package,
  Phone,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Layout } from "../../components/Layout";
import { statusBadge } from "../../components/RoleBadge";
import { useAuth } from "../../hooks/useAuth";
import { useDonorDonations } from "../../hooks/useDonations";
import type { DonationFormData } from "../../types";
import { DonationStatus } from "../../types";

const FOOD_TYPES = [
  "Biryani & Rice Dishes",
  "Dal & Curries",
  "Bread & Rotis",
  "Sweets & Desserts",
  "Snacks & Starters",
  "Veg Buffet",
  "Non-Veg Buffet",
  "Fruits & Salads",
  "Beverages",
  "Mixed / Other",
];

const UNITS = ["servings", "kg", "litres", "pieces", "boxes", "trays"];

function nowOffset(offsetMin = 0) {
  const d = new Date(Date.now() + offsetMin * 60000);
  return d.toISOString().slice(0, 16);
}

function formatDT(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Step 1: Details form ────────────────────────────────────────────────────

interface Step1Props {
  defaultValues: Partial<DonationFormData>;
  imagePreview: string | null;
  uploadProgress: number | null;
  onImageChange: (file: File | null, preview: string | null) => void;
  onNext: (data: DonationFormData) => void;
  onBack: () => void;
}

function DetailsForm({
  defaultValues,
  imagePreview,
  uploadProgress,
  onImageChange,
  onNext,
  onBack,
}: Step1Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DonationFormData>({ defaultValues });

  const foodType = watch("foodType");
  const unit = watch("unit");

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] ?? null;
      if (!file) {
        onImageChange(null, null);
        return;
      }
      const reader = new FileReader();
      reader.onload = () => onImageChange(file, reader.result as string);
      reader.readAsDataURL(file);
    },
    [onImageChange],
  );

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      {/* Food type */}
      <div className="space-y-1.5">
        <Label>
          Food Type <span className="text-destructive">*</span>
        </Label>
        <Select
          value={foodType}
          onValueChange={(v) =>
            setValue("foodType", v, { shouldValidate: true })
          }
        >
          <SelectTrigger data-ocid="donor.food_type_select">
            <SelectValue placeholder="Select food type" />
          </SelectTrigger>
          <SelectContent>
            {FOOD_TYPES.map((ft) => (
              <SelectItem key={ft} value={ft}>
                {ft}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          {...register("foodType", { required: "Food type is required" })}
        />
        {errors.foodType && (
          <p
            className="text-xs text-destructive"
            data-ocid="donor.food_type_field_error"
          >
            {errors.foodType.message}
          </p>
        )}
      </div>

      {/* Quantity + Unit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="quantity">
            Quantity <span className="text-destructive">*</span>
          </Label>
          <Input
            id="quantity"
            type="number"
            min={1}
            placeholder="100"
            data-ocid="donor.quantity_input"
            {...register("quantity", {
              required: "Required",
              min: { value: 1, message: "Min 1" },
            })}
          />
          {errors.quantity && (
            <p
              className="text-xs text-destructive"
              data-ocid="donor.quantity_field_error"
            >
              {errors.quantity.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label>Unit</Label>
          <Select value={unit} onValueChange={(v) => setValue("unit", v)}>
            <SelectTrigger data-ocid="donor.unit_select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pickup address */}
      <div className="space-y-1.5">
        <Label htmlFor="pickupAddress">
          Pickup Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="pickupAddress"
          placeholder="e.g. 42 MG Road, Bangalore – 560001"
          data-ocid="donor.pickup_address_input"
          {...register("pickupAddress", { required: "Address is required" })}
        />
        {errors.pickupAddress && (
          <p
            className="text-xs text-destructive"
            data-ocid="donor.address_field_error"
          >
            {errors.pickupAddress.message}
          </p>
        )}
      </div>

      {/* Pickup window */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="pickupWindowStart">
            Available From <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pickupWindowStart"
            type="datetime-local"
            data-ocid="donor.pickup_start_input"
            {...register("pickupWindowStart", { required: "Required" })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pickupWindowEnd">
            Available Until <span className="text-destructive">*</span>
          </Label>
          <Input
            id="pickupWindowEnd"
            type="datetime-local"
            data-ocid="donor.pickup_end_input"
            {...register("pickupWindowEnd", { required: "Required" })}
          />
        </div>
      </div>

      {/* Contact phone */}
      <div className="space-y-1.5">
        <Label htmlFor="contactPhone">
          Contact Phone <span className="text-destructive">*</span>
        </Label>
        <Input
          id="contactPhone"
          type="tel"
          placeholder="+91 98765 43210"
          data-ocid="donor.contact_phone_input"
          {...register("contactPhone", { required: "Phone is required" })}
        />
        {errors.contactPhone && (
          <p className="text-xs text-destructive">
            {errors.contactPhone.message}
          </p>
        )}
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          rows={3}
          placeholder="Packaging details, dietary info, special instructions…"
          data-ocid="donor.notes_textarea"
          {...register("notes")}
        />
      </div>

      {/* Image upload */}
      <div className="space-y-1.5">
        <Label>Food Photo (optional)</Label>
        <button
          type="button"
          className="w-full border-2 border-dashed border-input rounded-xl overflow-hidden cursor-pointer hover:border-primary/60 transition-colors"
          onClick={() => fileInputRef.current?.click()}
          data-ocid="donor.image_dropzone"
        >
          {imagePreview ? (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Food preview"
                className="w-full h-40 object-cover"
              />
              {uploadProgress !== null && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-1" />
                    <p className="text-xs font-medium text-foreground">
                      Uploading {uploadProgress}%
                    </p>
                  </div>
                </div>
              )}
              <button
                type="button"
                className="absolute top-2 right-2 bg-card/90 rounded-full p-1 hover:bg-card shadow-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onImageChange(null, null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                aria-label="Remove photo"
                data-ocid="donor.image_remove_button"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
              <ImageIcon className="w-8 h-8 opacity-50" />
              <p className="text-sm font-medium">Click to add a photo</p>
              <p className="text-xs">
                JPG, PNG, WEBP — helps NGOs identify food
              </p>
            </div>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
          data-ocid="donor.image_upload_button"
        />
      </div>

      {/* Navigation */}
      <div className="flex gap-3 pt-1">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
          onClick={onBack}
          data-ocid="donor.back_button"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <Button
          type="submit"
          size="lg"
          className="btn-primary flex-1 gap-2"
          data-ocid="donor.next_button"
        >
          Review <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

// ─── Step 2: Confirm summary ─────────────────────────────────────────────────

interface Step2Props {
  data: DonationFormData;
  imagePreview: string | null;
  onBack: () => void;
  onConfirm: () => Promise<void>;
  isSubmitting: boolean;
}

function ConfirmStep({
  data,
  imagePreview,
  onBack,
  onConfirm,
  isSubmitting,
}: Step2Props) {
  const { className, label } = statusBadge(DonationStatus.pending);

  return (
    <div className="space-y-5">
      <div className="card-elevated role-donor p-5 space-y-4">
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Food preview"
            className="w-full h-44 object-cover rounded-lg"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-bold text-lg">{data.foodType}</p>
            <p className="text-muted-foreground text-sm">
              {data.quantity} {data.unit}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`${className} text-xs font-semibold px-2.5 py-1 shrink-0`}
          >
            {label}
          </Badge>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground border-t border-border pt-3">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
            <span>{data.pickupAddress}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0 text-primary/70" />
            <span>
              {formatDT(data.pickupWindowStart)} –{" "}
              {formatDT(data.pickupWindowEnd)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 shrink-0 text-primary/70" />
            <span>{data.contactPhone}</span>
          </div>
          {data.notes && (
            <div className="flex items-start gap-2">
              <Package className="w-4 h-4 shrink-0 mt-0.5 text-primary/70" />
              <span className="italic">{data.notes}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-sm text-muted-foreground text-center">
        Once posted, nearby NGOs will be notified and can accept your donation.
      </p>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
          onClick={onBack}
          disabled={isSubmitting}
          data-ocid="donor.confirm_back_button"
        >
          <ArrowLeft className="w-4 h-4" /> Edit
        </Button>
        <Button
          size="lg"
          className="btn-primary flex-1 gap-2"
          onClick={onConfirm}
          disabled={isSubmitting}
          data-ocid="donor.submit_donation_button"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          Confirm &amp; Post
        </Button>
      </div>
    </div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {[
        { n: 1, label: "Details" },
        { n: 2, label: "Confirm" },
      ].map(({ n, label }, idx) => (
        <div key={n} className="flex items-center gap-2">
          {idx > 0 && (
            <div
              className={`h-0.5 w-8 rounded ${step > idx ? "bg-primary" : "bg-border"}`}
            />
          )}
          <div className="flex items-center gap-1.5">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                step === n
                  ? "bg-primary text-primary-foreground"
                  : step > n
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {step > n ? <CheckCircle2 className="w-3.5 h-3.5" /> : n}
            </div>
            <span
              className={`text-sm ${step === n ? "font-semibold text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewDonationPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { createDonation } = useDonorDonations();

  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState<DonationFormData | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  void profile; // available for prefill below

  const defaultValues: Partial<DonationFormData> = {
    unit: "servings",
    pickupWindowStart: nowOffset(30),
    pickupWindowEnd: nowOffset(120),
    contactPhone: profile?.phone ?? "",
    ...(formData ?? {}),
  };

  const handleImageChange = (file: File | null, preview: string | null) => {
    setImageFile(file);
    setImagePreview(preview);
    setUploadProgress(null);
  };

  const handleStep1Next = (data: DonationFormData) => {
    setFormData(data);
    setStep(2);
  };

  const handleConfirm = async () => {
    if (!formData) return;
    setIsSubmitting(true);
    try {
      // If there's an image, attach upload progress tracking
      let fileToUpload = imageFile;
      if (fileToUpload) {
        setUploadProgress(0);
        // We'll track progress via the ExternalBlob.withUploadProgress inside useDonorDonations
        // For now, show a quick indicator
        setUploadProgress(50);
      }

      await createDonation(formData, fileToUpload ?? undefined);

      if (fileToUpload) setUploadProgress(100);
      toast.success("🎉 Donation posted! Nearby NGOs have been notified.");
      navigate({ to: "/donor" });
    } catch (err) {
      console.error("createDonation error:", err);
      toast.error("Something went wrong. Please try again.");
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  return (
    <Layout>
      <div
        className="max-w-lg mx-auto px-4 py-6"
        data-ocid="donor.new_donation.page"
      >
        {/* Back to dashboard */}
        {step === 1 && (
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-5 transition-smooth"
            onClick={() => navigate({ to: "/donor" })}
            data-ocid="donor.back_to_dashboard_button"
          >
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </button>
        )}

        <h1 className="font-display text-2xl font-bold mb-1">Donate Food</h1>
        <p className="text-sm text-muted-foreground mb-5">
          Fill in the details — it takes less than 2 minutes.
        </p>

        <StepIndicator step={step} />

        {step === 1 ? (
          <DetailsForm
            defaultValues={defaultValues}
            imagePreview={imagePreview}
            uploadProgress={uploadProgress}
            onImageChange={handleImageChange}
            onNext={handleStep1Next}
            onBack={() => navigate({ to: "/donor" })}
          />
        ) : (
          formData && (
            <ConfirmStep
              data={formData}
              imagePreview={imagePreview}
              onBack={() => setStep(1)}
              onConfirm={handleConfirm}
              isSubmitting={isSubmitting}
            />
          )
        )}
      </div>
    </Layout>
  );
}
