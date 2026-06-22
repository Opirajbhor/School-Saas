import React from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { AnimatedGroup } from "@/components/motion-primitives/animated-group";

import { Spotify } from "@/components/ui/svgs/spotify";
import { SupabaseFull } from "@/components/ui/svgs/supabase";
import { Hulu } from "@/components/ui/svgs/hulu";
import { Bolt } from "@/components/ui/svgs/bolt";
import { FirebaseFull } from "@/components/ui/svgs/firebase";
import { Beacon } from "@/components/ui/svgs/beacon";
import { Claude } from "@/components/ui/svgs/claude";
import { VercelFull } from "@/components/ui/svgs/vercel";

const transitionVariants = {
  item: {
    hidden: {
      opacity: 0,
      filter: "blur(12px)",
      y: 12,
    },
    visible: {
      opacity: 1,
      filter: "blur(0px)",
      y: 0,
      transition: {
        type: "spring",
        bounce: 0.3,
        duration: 1.5,
      },
    },
  },
};

export default function HeroSection() {
  return (
    <main className="overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 isolate hidden opacity-60 contain-strict lg:block"
      >
        <div className="absolute left-0 top-0 h-96 w-96 -rotate-45 rounded-full bg-linear-to-br from-muted/30 to-transparent blur-3xl" />
        <div className="absolute left-0 top-0 h-64 w-80 -rotate-45 rounded-full bg-linear-to-br from-muted/20 to-transparent blur-2xl translate-x-12 -translate-y-20" />
        <div className="absolute left-0 top-0 h-64 w-64 -rotate-45 bg-linear-to-br from-muted/10 to-transparent blur-2xl" />
      </div>
      <section>
        <div className="relative pt-24 md:pt-36">
          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    delayChildren: 1,
                  },
                },
              },
              item: {
                hidden: {
                  opacity: 0,
                  y: 20,
                },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    type: "spring",
                    bounce: 0.3,
                    duration: 2,
                  },
                },
              },
            }}
            className="absolute inset-0 top-56 lg:top-12 mask-[linear-gradient(to_bottom,transparent_0%,black_35%,black_90%,transparent_100%)]"
          >
            <Image
              src="/public/dashboard_mockup.webp"
              alt="background"
              className="hidden size-full mix-blend-overlay dark:block"
              width="3276"
              height="4095"
            />
          </AnimatedGroup>

          <div
            aria-hidden
            className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
          />

          <div className="mx-auto max-w-7xl px-6">
            <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
              <AnimatedGroup variants={transitionVariants}>
                <Link
                  href="#link"
                  className="group mx-auto flex w-fit items-center gap-4 rounded-full border border-input bg-muted p-1 pl-4 shadow-sm transition-colors duration-300 hover:bg-muted/80"
                >
                  <span className="text-foreground text-sm">
                    Introducing Support for AI Models
                  </span>
                  <span className="block h-4 w-px border-l border-border"></span>

                  <div className="size-6 overflow-hidden rounded-full bg-background transition-colors duration-500 group-hover:bg-muted">
                    <div className="flex w-12 -translate-x-1/2 transition-transform duration-500 ease-in-out group-hover:translate-x-0">
                      <span className="flex size-6 items-center justify-center">
                        <ArrowRight className="size-3" />
                      </span>
                      <span className="flex size-6 items-center justify-center">
                        <ArrowRight className="size-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimatedGroup>

              <TextEffect
                preset="fade-in-blur"
                speedSegment={0.3}
                as="h1"
                className="mx-auto mt-8 max-w-4xl text-balance text-5xl max-md:font-semibold md:text-7xl lg:mt-16 xl:text-[5.25rem]"
              >
                Modern Solutions for Customer Engagement
              </TextEffect>
              <TextEffect
                per="line"
                preset="fade-in-blur"
                speedSegment={0.3}
                delay={0.5}
                as="p"
                className="mx-auto mt-8 max-w-2xl text-balance text-lg"
              >
                Highly customizable components for building modern websites and
                applications that look and feel the way you mean it.
              </TextEffect>

              <AnimatedGroup
                variants={{
                  container: {
                    visible: {
                      transition: {
                        staggerChildren: 0.05,
                        delayChildren: 0.75,
                      },
                    },
                  },
                  ...transitionVariants,
                }}
                className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
              >
                <div key={1}>
                  <Link href="#link">
                    <Button size="lg" className="rounded-md px-6">
                      <span className="whitespace-nowrap">Start Building</span>
                    </Button>
                  </Link>
                </div>
                <Link key={2} href="#link">
                  <Button size="lg" variant="ghost" className="rounded-md px-6">
                    <span className="whitespace-nowrap">Request a demo</span>
                  </Button>
                </Link>
              </AnimatedGroup>
            </div>
          </div>

          <AnimatedGroup
            variants={{
              container: {
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.75,
                  },
                },
              },
              ...transitionVariants,
            }}
          >
            <div className="relative mt-8 overflow-hidden px-2 mask-[linear-gradient(to_bottom,black_0%,black_55%,transparent_100%)] sm:mt-12 sm:px-0 md:mt-20">
              <div className="relative mx-auto max-w-6xl overflow-hidden rounded-xl border border-border bg-card p-4 shadow-lg">
                <Image
                  className="aspect-video hidden rounded-lg dark:block"
                  src="/mail2.png"
                  alt="app screen"
                  width="2700"
                  height="1440"
                />
                <Image
                  className="aspect-video relative rounded-lg dark:hidden"
                  src="/mail2-light.png"
                  alt="app screen"
                  width="2700"
                  height="1440"
                />
              </div>
            </div>
          </AnimatedGroup>
        </div>
      </section>
      <section className="bg-background pb-16 pt-16 md:pb-32">
        <div className="group relative m-auto max-w-5xl px-6">
          <div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
            <Link
              href="/"
              className="block text-sm duration-150 hover:opacity-75"
            >
              <span> Meet Our Customers</span>

              <ChevronRight className="ml-1 inline-block size-3" />
            </Link>
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-8 transition-all duration-500 [&_svg]:fill-foreground group-hover:blur-sm group-hover:opacity-50 sm:gap-16 md:grid-cols-4">
            <div className="flex items-center">
              <Bolt className="mx-auto h-5 w-full" />
            </div>
            <div className="flex items-center">
              <VercelFull className="mx-auto h-4 w-full" />
            </div>
            <div className="flex items-center">
              <SupabaseFull className="mx-auto h-6" />
            </div>
            <div className="flex items-center">
              <Hulu className="mx-auto h-4 w-full" />
            </div>
            <div className="flex items-center">
              <Spotify className="mx-auto h-6 w-full" />
            </div>
            <div className="flex items-center">
              <FirebaseFull className="mx-auto h-6 w-full" />
            </div>
            <div className="flex items-center">
              <Beacon className="mx-auto h-4 w-full" />
            </div>

            <div className="flex items-center">
              <Claude className="mx-auto h-5 w-full" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
