"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useSession } from "next-auth/react";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AccountFormType,
  accountSchema,
  passwordFormSchema,
  PasswordFormType,
} from "@/lib/validation-schemas";
import { updateUserName, updateUserPassword } from "./query";
import { toast } from "sonner";

const AccountPage = () => {
  const { data, status } = useSession();

  console.log(data);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const accountForm = useForm<AccountFormType>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: data?.user.name || "",
    },
  });

  // Update form when session data changes
  React.useEffect(() => {
    if (data?.user.name) {
      accountForm.setValue("name", data.user.name);
    }
  }, [data?.user.name, accountForm]);

  const passwordForm = useForm<PasswordFormType>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
  //   const file = e.target.files?.[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onloadend = () => setProfileImage(reader.result as string);
  //   reader.readAsDataURL(file);
  // };

  const handleAccountUpdate = async (values: AccountFormType) => {
    setLoadingAccount(true);

    try {
      const res = await updateUserName({ name: values.name });

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setLoadingAccount(false);
    }
  };

  const handlePasswordUpdate = async (values: PasswordFormType) => {
    setLoadingPassword(true);

    if (
      !values.confirmPassword ||
      !values.currentPassword ||
      !values.newPassword
    ) {
      setLoadingPassword(false);
      return toast.error("Invalid inputs", {
        description: "Please fill all details",
      });
    }

    try {
      const res = await updateUserPassword(values);
      if (res.success) {
        passwordForm.reset();
        toast.success(res.message);
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error("An unexpected error occurred while updating password");
    } finally {
      setLoadingPassword(false);
    }
  };

  if (status === "loading") return <div>Loading...</div>;

  if (status !== "authenticated") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 ">
      <div className="space-y-2 mb-6 max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-slate-600">
          Manage your account information and security preferences
        </p>
      </div>

      <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Update your details</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={accountForm.handleSubmit(handleAccountUpdate)}
                className="space-y-4"
              >
                {/* <div className="relative inline-block"> */}
                {/* <Avatar className="h-24 w-24">
                    <AvatarImage
                      src={profileImage}
                      alt={data?.user.name || ""}
                    />
                    <AvatarFallback className="text-2xl">
                      {data?.user.name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar> */}

                {/* <label
                    htmlFor="pic-upload"
                    className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-2 cursor-pointer shadow hover:bg-primary/90 transition"
                  >
                    <Camera className="h-4 w-4" />
                  </label>
                  <input
                    id="pic-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  /> */}
                {/* </div> */}
                {/* <div>
                  <p className="text-sm font-medium">Upload a new picture</p>
                  <p className="text-xs text-slate-500">
                    JPG, PNG or GIF. Max 5MB.
                  </p>
                </div> */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" {...accountForm.register("name")} />
                  {accountForm.formState.errors.name && (
                    <p className="text-sm text-red-500">
                      {accountForm.formState.errors.name.message}
                    </p>
                  )}
                </div>

                {/* email */}
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input
                    disabled
                    value={data?.user.email || ""}
                    className="bg-slate-100"
                  />
                  <p className="text-xs text-slate-500">
                    Email cannot be changed.
                  </p>
                </div>

                <Button disabled={loadingAccount}>
                  {loadingAccount && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {data.user.provider == "CREDENTIALS" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)}
                  className="space-y-4"
                >
                  {/* current password */}
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      {...passwordForm.register("currentPassword")}
                    />
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* new password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      {...passwordForm.register("newPassword")}
                    />
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  {/* confirm password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      {...passwordForm.register("confirmPassword")}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <Button disabled={loadingPassword}>
                    {loadingPassword && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountPage;
