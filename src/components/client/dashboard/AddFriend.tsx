"use client";

import React, { useState, useEffect, useMemo } from "react";
import { api } from "@/trpc/react";
// import { api } from "@/trpc/server";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AddFriend() {
  const [retrievedUser, setRetrievedUser] = useState<{
    id: string;
    username: string;
    firstName: string | null;
    image_url: string;
  } | null>(null);
  //   const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [noUserFound, setNoUserFound] = useState(false);

  const { toast } = useToast();
  const sendFriendRequestMutation =
    api.friendships.sendFriendRequest.useMutation();

  const utils = api.useUtils();

  const FormSchema = z.object({
    username: z.string().min(2, {
      message: "Username must be at least 2 characters.",
    }),
  });

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
    },
  });

  useEffect(() => {
    if (noUserFound) {
      toast({
        variant: "destructive",
        title: "No user found!",
        description: "Double check the username.",
        duration: 5000,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => setNoUserFound(false)}
          >
            Try again
          </ToastAction>
        ),
      });
    }
  }, [noUserFound, toast]);

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setLoading(true);
    const user = await utils.users.getUser.fetch({ username: data.username });

    console.log(`user`, user);

    if (!user) {
      setNoUserFound(true);
      setLoading(false);
      retrievedUser !== null && setRetrievedUser(null);
      return;
    }

    setLoading(false);

    setRetrievedUser(user);
  }

  const handleSendFriendRequest = (retrieveId: string) => {
    // await utils.friendships

    sendFriendRequestMutation.mutate({
      receiverId: retrieveId,
    });

    toast({
      variant: "default",
      title: "Friend request sent!",
      duration: 3000,
      description: `You sent a friend request${
        retrievedUser && ` to ${retrievedUser.username}`
      }`,
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader className="items-center">
          <CardTitle>Add a new Friend!</CardTitle>
          <CardDescription>Challenge friends to play!</CardDescription>
        </CardHeader>
        <Separator className="mb-2" />
        <CardContent>
          {loading && (
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          )}

          {retrievedUser && (
            <>
              <div className="my-2 flex min-w-0 gap-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={retrievedUser.image_url}
                    alt="Profile Picture"
                  />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-auto">
                  <p className="text-sm font-semibold leading-6 text-gray-900">
                    {retrievedUser.firstName}
                  </p>
                  <p className="mt-1 truncate text-xs leading-5 text-gray-500">
                    {retrievedUser.username}
                  </p>
                </div>
                <Button
                  onClick={() => handleSendFriendRequest(retrievedUser.id)}
                >
                  Add
                </Button>
              </div>
            </>
          )}

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="w-full space-y-6"
            >
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input
                        onChangeCapture={() =>
                          retrievedUser !== null && setRetrievedUser(null)
                        }
                        datatype={"none"}
                        placeholder="minamaxi"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter the username of the friend you want to add.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button disabled={loading} type="submit">
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Add Friend"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}

export default AddFriend;