"use client";

import React, { useState } from "react";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { FREE_TIER_LIMITS, PAID_TIER_LIMITS } from "@/lib/limits";
import { Check } from "lucide-react";

export default function BillingPage() {
  const [selectedPlan, setSelectedPlan] = useState<"free" | "pro">("free");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Subscription Plans</h1>
        <p className="text-muted-foreground">
          Choose the right plan for your organization needs.
        </p>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Free Tier */}
          <div
            className={`border rounded-lg overflow-hidden ${
              selectedPlan === "free" ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold">Free Plan</h2>
              <p className="text-muted-foreground mt-1">
                For individuals and small teams
              </p>

              <div className="mt-4">
                <span className="text-3xl font-bold">$0</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <button
                className={`w-full mt-6 py-2 rounded-md ${
                  selectedPlan === "free"
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background"
                }`}
                onClick={() => setSelectedPlan("free")}
              >
                {selectedPlan === "free" ? "Current Plan" : "Select Plan"}
              </button>
            </div>

            <div className="bg-muted p-6 border-t">
              <h3 className="font-medium mb-4">What&apos;s included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>{FREE_TIER_LIMITS.MAX_ORGANIZATIONS} organization</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Basic budget features</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Standard support</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Pro Tier */}
          <div
            className={`border rounded-lg overflow-hidden ${
              selectedPlan === "pro" ? "ring-2 ring-primary" : ""
            }`}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold">Pro Plan</h2>
              <p className="text-muted-foreground mt-1">
                For businesses and multiple projects
              </p>

              <div className="mt-4">
                <span className="text-3xl font-bold">$19</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <button
                className={`w-full mt-6 py-2 rounded-md ${
                  selectedPlan === "pro"
                    ? "bg-primary text-primary-foreground"
                    : "border border-input bg-background"
                }`}
                onClick={() => setSelectedPlan("pro")}
              >
                {selectedPlan === "pro" ? "Current Plan" : "Select Plan"}
              </button>
            </div>

            <div className="bg-muted p-6 border-t">
              <h3 className="font-medium mb-4">What&apos;s included:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>
                    Up to {PAID_TIER_LIMITS.MAX_ORGANIZATIONS} organizations
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Unlimited team members</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Advanced budget features</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Data export</span>
                </li>
                <li className="flex items-start">
                  <Check className="mr-2 h-5 w-5 text-primary flex-shrink-0" />
                  <span>Custom reporting</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 border rounded-lg bg-muted">
          <h3 className="text-xl font-medium mb-2">Coming Soon</h3>
          <p className="text-muted-foreground">
            Payment integration will be available soon. For now, this is a
            placeholder to show how the subscription system will work.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
