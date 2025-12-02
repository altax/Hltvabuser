import { useState } from "react";
import { Moon, Sun, Monitor, Database, Github, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure your CS2 Analytics platform
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>Customize how the application looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Theme</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-1"
                  data-testid="button-theme-light"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                  data-testid="button-theme-dark"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  onClick={() => setTheme("system")}
                  className="flex-1"
                  data-testid="button-theme-system"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Collection</CardTitle>
            <CardDescription>Configure data collection settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-collect new matches</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically fetch new matches daily
                </p>
              </div>
              <Switch disabled data-testid="switch-auto-collect" />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Parse demo files</Label>
                <p className="text-sm text-muted-foreground">
                  Download and parse demo files for detailed stats
                </p>
              </div>
              <Switch disabled data-testid="switch-parse-demos" />
            </div>
            <div className="pt-2">
              <Badge variant="secondary">Coming soon</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database Status</CardTitle>
            <CardDescription>Current database information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Database className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="font-medium">PostgreSQL</p>
                <p className="text-sm text-muted-foreground">Connected</p>
              </div>
              <Badge variant="default" className="ml-auto">Active</Badge>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Database Type</p>
                <p className="font-mono font-medium">Neon PostgreSQL</p>
              </div>
              <div>
                <p className="text-muted-foreground">Connection</p>
                <p className="font-mono font-medium">Secure (SSL)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">About</CardTitle>
            <CardDescription>CS2 Analytics Platform information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Info className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">CS2 Analytics Platform</p>
                <p className="text-sm text-muted-foreground">Version 1.0.0</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Deep analytics platform for CS2 esports matches. Tracks grenade kills, 
                player statistics, and match analysis for top 30 HLTV teams.
              </p>
              <p className="text-muted-foreground">
                Built for professional esports analysts and betting enthusiasts.
              </p>
            </div>
            <div className="pt-2">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid="link-github"
                >
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
