import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ratesApi, settingsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { insertGoldRateSchema } from "@shared/schema";

// Create a custom schema that converts strings to numbers
const goldRateFormSchema = insertGoldRateSchema.extend({
  gold_24k_sale: z.coerce.number().min(0),
  gold_24k_purchase: z.coerce.number().min(0),
  gold_22k_sale: z.coerce.number().min(0),
  gold_22k_purchase: z.coerce.number().min(0),
  gold_18k_sale: z.coerce.number().min(0),
  gold_18k_purchase: z.coerce.number().min(0),
  silver_per_kg_sale: z.coerce.number().min(0),
  silver_per_kg_purchase: z.coerce.number().min(0),
});

export default function MobileControl() {
  const { toast } = useToast();

  const formatToIST = (value: string | number | Date) => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
      }).format(new Date(value));
    } catch {
      return "";
    }
  };

  // Get current rates
  const { data: currentRates, isLoading } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent
  });

  // Get display settings for color customization
  const { data: displaySettings } = useQuery({
    queryKey: ["/api/settings/display"],
    queryFn: settingsApi.getDisplay,
    staleTime: 60_000
  });

  const bgColor = displaySettings?.background_color || "#FFF8E1";
  const textColor = displaySettings?.text_color || "#212529";

  // Form setup with custom schema
  const form = useForm<z.infer<typeof goldRateFormSchema>>({
    resolver: zodResolver(goldRateFormSchema),
    defaultValues: {
      gold_24k_sale: currentRates?.gold_24k_sale ?? 0,
      gold_24k_purchase: currentRates?.gold_24k_purchase ?? 0,
      gold_22k_sale: currentRates?.gold_22k_sale ?? 0,
      gold_22k_purchase: currentRates?.gold_22k_purchase ?? 0,
      gold_18k_sale: currentRates?.gold_18k_sale ?? 0,
      gold_18k_purchase: currentRates?.gold_18k_purchase ?? 0,
      silver_per_kg_sale: currentRates?.silver_per_kg_sale ?? 0,
      silver_per_kg_purchase: currentRates?.silver_per_kg_purchase ?? 0,
      is_active: true,
    }
  });

  // Update rates mutation
  const updateRatesMutation = useMutation({
    mutationFn: ratesApi.create,
    onSuccess: (result) => {
      console.log('Mutation successful:', result);
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
      toast({
        title: "Success",
        description: "Rates updated successfully! Changes will appear on TV display."
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: "Error",
        description: `Failed to update rates: ${error.message}`,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: z.infer<typeof goldRateFormSchema>) => {
    // Data is already converted to numbers by zod's coerce.number()
    const submitData = {
      ...data,
      is_active: true
    };
    
    console.log('Submitting data:', submitData);
    updateRatesMutation.mutate(submitData);
  };

  // Update form values when current rates change
  React.useEffect(() => {
    if (currentRates) {
      form.reset({
        gold_24k_sale: currentRates.gold_24k_sale,
        gold_24k_purchase: currentRates.gold_24k_purchase,
        gold_22k_sale: currentRates.gold_22k_sale,
        gold_22k_purchase: currentRates.gold_22k_purchase,
        gold_18k_sale: currentRates.gold_18k_sale,
        gold_18k_purchase: currentRates.gold_18k_purchase,
        silver_per_kg_sale: currentRates.silver_per_kg_sale,
        silver_per_kg_purchase: currentRates.silver_per_kg_purchase,
        is_active: true
      });
    }
  }, [currentRates, form]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bgColor, color: textColor }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-jewelry-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading rates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
      {/* Mobile Header */}
      <div className="p-4 flex justify-center" style={{ color: textColor }}>
        <img 
          src="/logo.png" 
          alt="Devi Jewellers Logo"
          className="h-40 w-[350px] object-contain"
        />
      </div>

      <div className="p-4 space-y-6">
        {/* Quick Status Card */}
        <Card className="border-l-4 border border-black" style={{ backgroundColor: "#ffffffcc" }}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold" style={{ color: textColor }}>Last Updated</h3>
                <p className="text-sm opacity-80" style={{ color: textColor }}>
                  {currentRates?.created_date 
                    ? formatToIST(currentRates.created_date)
                    : "Never"
                  }
                </p>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </CardContent>
        </Card>

        {/* Rate Update Form */}
        <Card className="w-full text-black py-4 text-lg border-2 border-black rounded-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader className="text-black" style={{ backgroundColor: bgColor }}>
            <CardTitle className="flex items-center text-lg" style={{ color: textColor }}>
              Update Gold & Silver Rates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* 24K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: textColor }}>
                    <span className="mr-2">★</span>24K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_24k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gold_24k_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 22K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: textColor }}>
                    <span className="mr-2">◆</span>22K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_22k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gold_22k_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 18K Gold */}
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: textColor }}>
                    <span className="mr-2">♦</span>18K Gold (Per 10 GMS)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="gold_18k_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="gold_18k_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Silver */}
                <div className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: textColor }}>
                    <span className="mr-2">●</span>Silver (Per KG)
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="silver_per_kg_sale"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sale Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="silver_per_kg_purchase"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Purchase Rate</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="50"
                              min="0"
                              {...field}
                              className="border-2 border-black rounded px-2 py-1 text-sm font-semibold"
                              style={{ color: textColor, backgroundColor: bgColor }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-black py-4 text-lg border-2 border-black rounded-lg transition-colors duration-300"
                  style={{ backgroundColor: bgColor, color: textColor }}
                  disabled={updateRatesMutation.isPending}
                >
                  {updateRatesMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      Update Rates on TV Display
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Current Rates Display */}
        <Card className="w-full text-black py-4 text-lg border-2 border-black rounded-lg" style={{ backgroundColor: "#ffffff" }}>
          <CardHeader style={{ backgroundColor: bgColor }}>
            <CardTitle className="flex items-center text-lg" style={{ color: textColor }}>
              Currently Displayed Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-xl">
              <div className="flex justify-between" style={{ color: textColor }}>
                <span>24K Gold Sale:</span>
                <span className="font-semibold border-2 border-black rounded-md px-2 py-1">₹{currentRates?.gold_24k_sale}</span>
              </div>
              <div className="flex justify-between" style={{ color: textColor }}>
                <span>22K Gold Sale:</span>
                <span className="font-semibold border-2 border-black rounded-md px-2 py-1">₹{currentRates?.gold_22k_sale}</span>
              </div>
              <div className="flex justify-between" style={{ color: textColor }}>
                <span>Silver Sale:</span>
                <span className="font-semibold border-2 border-black rounded-md px-2 py-1">₹{currentRates?.silver_per_kg_sale}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
