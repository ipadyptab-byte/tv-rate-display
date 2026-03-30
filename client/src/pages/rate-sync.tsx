import React from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ratesApi, settingsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import type { RateSettings } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const rateSettingsSchema = z.object({
  perc_24k_purchase: z.number().min(0).max(1),
  perc_22k_sale: z.number().min(0).max(1),
  perc_22k_purchase: z.number().min(0).max(1),
  perc_18k_sale: z.number().min(0).max(1),
  perc_18k_purchase: z.number().min(0).max(1),
  silver_purchase_offset: z.number(), // can be negative, e.g. -5000
  check_interval_minutes: z.number().min(1).max(120).default(5),
});

export default function RateSync() {
  const { toast } = useToast();

  const { data: currentRates } = useQuery({
    queryKey: ["/api/rates/current"],
    queryFn: ratesApi.getCurrent,
    staleTime: 0,
    refetchOnMount: true,
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });

  const { data: rateSettings } = useQuery<RateSettings | null>({
    queryKey: ["/api/settings/rates"],
    queryFn: settingsApi.getRate,
  });

  const form = useForm<z.infer<typeof rateSettingsSchema>>({
    resolver: zodResolver(rateSettingsSchema),
    defaultValues: {
      perc_24k_purchase: 0.985,
      perc_22k_sale: 0.920,
      perc_22k_purchase: 0.900,
      perc_18k_sale: 0.860,
      perc_18k_purchase: 0.800,
      silver_purchase_offset: -5000,
      check_interval_minutes: 1,
    },
  });

  React.useEffect(() => {
    if (rateSettings) {
      form.reset({
        perc_24k_purchase: rateSettings.perc_24k_purchase ?? 0.985,
        perc_22k_sale: rateSettings.perc_22k_sale ?? 0.920,
        perc_22k_purchase: rateSettings.perc_22k_purchase ?? 0.900,
        perc_18k_sale: rateSettings.perc_18k_sale ?? 0.860,
        perc_18k_purchase: rateSettings.perc_18k_purchase ?? 0.800,
        silver_purchase_offset: rateSettings.silver_purchase_offset ?? -5000,
        check_interval_minutes: rateSettings.check_interval_minutes ?? 1,
      });
    }
  }, [rateSettings, form]);

  const saveMutation = useMutation({
    mutationFn: async (data: z.infer<typeof rateSettingsSchema>) => {
      if (rateSettings?.id) {
        return await settingsApi.updateRate(rateSettings.id, data);
      } else {
        return await settingsApi.createRate(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/rates"] });
      toast({ title: "Saved", description: "Rate settings updated" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await ratesApi.sync({ force: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
      toast({ title: "Synced", description: "Rates fetched and stored" });
    },
    onError: (error: Error) => {
      toast({ title: "Sync failed", description: error.message, variant: "destructive" });
    }
  });

  const autoSyncMutation = useMutation({
    mutationFn: async () => {
      return await ratesApi.sync({ force: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rates/current"] });
    },
  });

  // Auto sync while this page is open (respects interval)
  React.useEffect(() => {
    const minutes = rateSettings?.check_interval_minutes ?? 5;
    const delayMs = Math.max(1, minutes) * 60_000;

    const tick = () => {
      if (!autoSyncMutation.isPending) {
        autoSyncMutation.mutate();
      }
    };

    // Run once immediately when settings are known, then on interval.
    if (rateSettings) {
      tick();
    }

    const interval = setInterval(tick, delayMs);

    return () => clearInterval(interval);
  }, [rateSettings?.check_interval_minutes, rateSettings?.id]);

  const onSubmit = (data: z.infer<typeof rateSettingsSchema>) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800">Rate Sync</h2>
          <p className="text-gray-600">Fetch 24K sale and Silver sale, compute rest via percentages</p>
        </div>

        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
            <CardTitle className="flex items-center">
              <i className="fas fa-percentage mr-2"></i>Calculation Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="perc_24k_purchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>24K Purchase (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.985} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_22k_sale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>22K Sale (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.920} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_22k_purchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>22K Purchase (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={field.value ?? 0.900}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_18k_sale"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>18K Sale (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            max="1"
                            value={field.value ?? 0.860}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="perc_18k_purchase"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>18K Purchase (% of 24K Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.001" min="0" max="1" value={field.value ?? 0.800} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="silver_purchase_offset"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Silver Purchase Offset (added to Silver Sale)</FormLabel>
                        <FormControl>
                          <Input type="number" step="1" value={field.value ?? -5000} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <p className="text-xs text-gray-600">Example: -5000 means Silver purchase = Silver sale - 5000</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="check_interval_minutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Auto Sync Interval (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="120" value={field.value ?? 5} onChange={(e) => field.onChange(Number(e.target.value))} />
                        </FormControl>
                        <p className="text-xs text-gray-600">Server will check and store new rates every N minutes.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="bg-jewelry-primary text-white" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save Settings"}
                  </Button>
                  <Button type="button" variant="outline" className="text-orange-700 border-orange-300" onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending}>
                    <i className="fas fa-sync mr-2"></i>
                    {syncMutation.isPending ? "Syncing..." : "Fetch & Store"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {currentRates && (
          <Card>
            <CardHeader>
              <CardTitle>Current Stored Rates</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
              <div>24K Sale: <span className="font-semibold">{currentRates.gold_24k_sale}</span></div>
              <div>24K Purchase: <span className="font-semibold">{currentRates.gold_24k_purchase}</span></div>
              <div>22K Sale: <span className="font-semibold">{currentRates.gold_22k_sale}</span></div>
              <div>22K Purchase: <span className="font-semibold">{currentRates.gold_22k_purchase}</span></div>
              <div>18K Sale: <span className="font-semibold">{currentRates.gold_18k_sale}</span></div>
              <div>18K Purchase: <span className="font-semibold">{currentRates.gold_18k_purchase}</span></div>
              <div>Silver Sale: <span className="font-semibold">{currentRates.silver_per_kg_sale}</span></div>
              <div>Silver Purchase: <span className="font-semibold">{currentRates.silver_per_kg_purchase}</span></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
