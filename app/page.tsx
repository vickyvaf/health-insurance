"use client";

import * as Icons from "@radix-ui/react-icons";
import {
  Box,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Heading,
  Section,
  Separator,
  Spinner,
  Text,
  TextField,
} from "@radix-ui/themes";
import { useMutation } from "@tanstack/react-query";
import { useReducer, useRef } from "react";
import { createOrder, triggerWebhook } from "./api/client";
import { initialState, paymentReducer } from "./reducers/payment";

const plans = [
  {
    name: "Basic",
    price: 1500000,
    description: "Perfect for individuals starting their insurance journey.",
    features: ["Outpatient Care", "Emergency Coverage", "Annual Checkup"],
    icon: <Icons.CheckCircledIcon />,
  },
  {
    name: "Standard",
    price: 2500000,
    description: "Our most comprehensive plan for complete protection.",
    popular: true,
    features: [
      "Everything in Basic",
      "Inpatient Care",
      "Specialist Consultations",
      "Prescription Drugs",
    ],
    icon: <Icons.CheckCircledIcon />,
  },
  {
    name: "Premium",
    price: 3500000,
    description: "Global coverage for you and your growing family.",
    features: [
      "Everything in Standard",
      "Global Coverage",
      "Family Protection",
      "Priority 24/7 Support",
    ],
    icon: <Icons.CheckCircledIcon />,
  },
];

export default function Home() {
  const [state, dispatch] = useReducer(paymentReducer, initialState);
  const checkoutRef = useRef<HTMLDivElement>(null);

  const {
    step,
    selectedPlan,
    cardNumber,
    expiryDate,
    cvv,
    fullName,
    email,
    transactionId,
  } = state;

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/gi, "");
    if (v.length <= 3) {
      dispatch({ type: "SET_CVV", payload: v });
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      dispatch({ type: "SET_CARD_NUMBER", payload: formatted });
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const handleExpiryDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (v.length < expiryDate.length) {
      dispatch({ type: "SET_EXPIRY_DATE", payload: v });
      return;
    }
    const formatted = formatExpiryDate(v);
    if (formatted.length <= 5) {
      dispatch({ type: "SET_EXPIRY_DATE", payload: formatted });
    }
  };

  const handleReturnToDashboard = () => {
    dispatch({ type: "RESET_FORM" });
    paymentMutation.reset();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const selectedPlanData =
        plans.find((p) => p.name === selectedPlan) || plans[1];
      const planIndex = plans.findIndex((p) => p.name === selectedPlan) + 1;

      // 1. Create Order
      const orderData = await createOrder({
        productId: planIndex,
        amount: selectedPlanData.price,
      });

      // 2. Simulate Payment Provider Delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 3. Trigger Webhook Simulation
      await triggerWebhook({
        wixOrderId: orderData.wixOrderId,
        status: "SUCCESS",
        amount: selectedPlanData.price,
        timestamp: new Date().toISOString(),
      });

      return orderData;
    },
    onSuccess: (data) => {
      dispatch({ type: "SET_TRANSACTION_ID", payload: data.orderId });
      dispatch({ type: "SET_STEP", payload: "success" });
    },
    onMutate: () => {
      dispatch({ type: "SET_STEP", payload: "processing" });
    },
    onError: () => {
      dispatch({ type: "SET_STEP", payload: "error" });
    },
  });

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    paymentMutation.mutate();
  };

  const scrollToCheckout = (planName?: string) => {
    if (planName) {
      dispatch({ type: "SET_SELECTED_PLAN", payload: planName });
    }
    checkoutRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const selectedPlanData =
    plans.find((p) => p.name === selectedPlan) || plans[1];

  if (step === "success") {
    return (
      <Container size="2" p="4">
        <Section py="9">
          <Card
            size="4"
            className="rounded-[32px] border-2 border-gray-50 overflow-hidden"
          >
            <Flex direction="column" align="center" gap="8" p="8">
              <Box className="bg-green-50 p-6 rounded-full text-green-600">
                <Icons.CheckCircledIcon width="64" height="64" />
              </Box>

              <Flex direction="column" align="center" gap="3">
                <Heading
                  size="8"
                  align="center"
                  className="text-gray-900 font-extrabold"
                >
                  Payment Successful
                </Heading>
                <Text
                  color="gray"
                  size="3"
                  className="max-w-md mx-auto leading-relaxed text-center"
                >
                  Your payment for <strong>{selectedPlan} Plan</strong>{" "}
                  insurance has been successfully processed. Thank you for
                  choosing us.
                </Text>
              </Flex>

              <Card
                variant="surface"
                className="w-full max-w-[400px] bg-gray-50 rounded-2xl p-6 border border-gray-100"
              >
                <Flex direction="column" align="center" gap="1">
                  <Text
                    size="1"
                    weight="bold"
                    className="uppercase tracking-widest text-gray-400"
                  >
                    Transaction ID
                  </Text>
                  <Text
                    size="2"
                    weight="bold"
                    className="font-mono text-gray-900 break-all"
                  >
                    {transactionId || "HS-987654321"}
                  </Text>
                </Flex>
              </Card>

              <Flex direction="column" gap="4" width="100%" maxWidth="400px">
                <Button
                  size="4"
                  className="w-full bg-blue-600 text-white font-bold h-14 rounded-2xl shadow-xl shadow-blue-100 cursor-pointer"
                >
                  <Icons.DownloadIcon />
                  Download Receipt
                </Button>
                <Button
                  size="4"
                  variant="outline"
                  onClick={handleReturnToDashboard}
                  className="w-full h-14 rounded-2xl font-bold cursor-pointer"
                >
                  Return to Dashboard
                  <Icons.ArrowRightIcon />
                </Button>
              </Flex>
            </Flex>
          </Card>
        </Section>
      </Container>
    );
  }

  if (step === "error") {
    return (
      <Container size="2" p="4">
        <Section py="9">
          <Card
            size="4"
            className="rounded-[32px] border-2 border-gray-50 overflow-hidden"
          >
            <Flex direction="column" align="center" gap="8" p="8">
              <Box className="bg-red-50 p-6 rounded-full text-red-600">
                <Icons.ExclamationTriangleIcon width="64" height="64" />
              </Box>

              <Flex direction="column" align="center" gap="3">
                <Heading
                  size="8"
                  align="center"
                  className="text-red-600 font-extrabold"
                >
                  Payment Failed
                </Heading>
                <Text
                  color="gray"
                  size="3"
                  className="max-w-md mx-auto leading-relaxed text-center"
                >
                  {(paymentMutation.error as Error)?.message ||
                    "We encountered an issue while processing your payment. Please check your details and try again."}
                </Text>
              </Flex>

              <Button
                size="4"
                color="gray"
                highContrast
                onClick={() =>
                  dispatch({ type: "SET_STEP", payload: "selection" })
                }
                className="h-14 rounded-2xl font-bold cursor-pointer"
              >
                <Icons.ArrowLeftIcon />
                Return to Payment Details
              </Button>
            </Flex>
          </Card>
        </Section>
      </Container>
    );
  }

  if (step === 'processing') {
    return (
      <Container size="2" p="4">
        <Section py="9">
          <Card
            size="4"
            className="rounded-[32px] border-2 border-gray-50 overflow-hidden"
          >
            <Flex direction="column" align="center" gap="8" p="8">
              <Box className="text-center">
                <Heading size="7" mb="2" className="text-gray-900">
                  Processing Payment
                </Heading>
                <Text size="2" color="gray">
                  Please do not close or refresh this window.
                </Text>
              </Box>

              <Flex direction="column" align="center" py="9" gap="3">
                <Spinner size="3" />
                <Text className="animate-pulse">Contacting your bank...</Text>
              </Flex>

              <Card className="w-full bg-gray-50 rounded-2xl p-6 opacity-50 grayscale pointer-events-none border-none">
                <Flex direction="column" gap="4">
                  <Box className="space-y-2">
                    <Text
                      size="1"
                      weight="bold"
                      className="uppercase tracking-widest text-gray-400"
                    >
                      Card Information
                    </Text>
                    <Card
                      variant="surface"
                      className="w-full bg-white rounded-xl p-3 border-gray-100"
                    >
                      <Flex align="center" gap="3">
                        <Icons.CardStackIcon className="text-gray-300" />
                        <Text className="text-gray-300 font-medium">
                          **** **** **** 1234
                        </Text>
                      </Flex>
                    </Card>
                  </Box>
                </Flex>
              </Card>
            </Flex>
          </Card>
        </Section>
      </Container>
    );
  }

  return (
    <Box className="min-h-screen bg-white font-sans selection:bg-blue-100 overflow-x-hidden">
      {/* Hero Section */}
      <Section className="relative pt-20 pb-16 md:pt-32 md:pb-32 overflow-hidden">
        <Container size="4" className="relative z-10 px-6">
          <Flex direction={{ initial: "column", md: "row" }} align="center">
            <Box className="w-full md:w-1/2 mb-12 md:mb-0">
              <Flex
                align="center"
                gap="2"
                className="bg-blue-50 px-3 py-1 rounded-full mb-6 w-fit"
              >
                <Box className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                <Text className="text-blue-700 text-[10px] font-bold uppercase tracking-wider">
                  Digital-First Healthcare
                </Text>
              </Flex>
              <Heading
                as="h1"
                size="9"
                className="font-extrabold text-[#111827] leading-[1.1]"
                mb="3"
              >
                Simple Health Insurance. <br />
                <Text color="blue">Instant Protection.</Text>
              </Heading>
              <Text
                as="p"
                size="4"
                className="text-gray-500 max-w-lg leading-relaxed block"
                mb="6"
              >
                Buy affordable health insurance plans in minutes with secure
                online payments. No paperwork, no wait times, just instant peace
                of mind.
              </Text>
              <Flex direction={{ initial: "column", sm: "row" }} gap="4" mb="7">
                <Button
                  size="4"
                  onClick={() => scrollToCheckout()}
                  className="bg-blue-600 text-white font-bold h-14 px-8 rounded-xl shadow-lg shadow-blue-100 cursor-pointer"
                >
                  Get Insured Now
                </Button>
                <Button
                  size="4"
                  variant="outline"
                  onClick={() =>
                    document
                      .getElementById("plans")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="h-14 px-8 rounded-xl font-bold border-2 cursor-pointer"
                >
                  View Plans
                </Button>
              </Flex>
              <Flex align="center" gap="4">
                <Flex className="-space-x-3">
                  {[1, 2, 3].map((i) => (
                    <Box
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center overflow-hidden"
                    >
                      <Box
                        className={`w-full h-full ${
                          i === 1
                            ? "bg-orange-200"
                            : i === 2
                              ? "bg-orange-300"
                              : "bg-orange-400"
                        }`}
                      />
                    </Box>
                  ))}
                </Flex>
                <Text className="text-sm text-gray-500">
                  Trusted by over{" "}
                  <Text weight="bold" className="text-gray-900">
                    50,000+
                  </Text>{" "}
                  individuals in Indonesia.
                </Text>
              </Flex>
            </Box>

            <Box className="w-full md:w-1/2 relative">
              <Box className="absolute -top-20 -right-20 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-50 -z-10" />
              <Box className="bg-[#EEF4FF] p-8 md:p-12 rounded-[40px] shadow-sm">
                <Card
                  size="3"
                  className="bg-white rounded-3xl shadow-xl p-8 max-w-sm mx-auto border-none"
                >
                  <Flex justify="between" align="start" mb="8">
                    <Flex
                      width="48px"
                      height="48px"
                      align="center"
                      justify="center"
                      className="bg-blue-50 rounded-xl text-blue-600"
                    >
                      <Icons.LockClosedIcon width="24" height="24" />
                    </Flex>
                    <Box className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                      Active
                    </Box>
                  </Flex>
                  <Box mb="8">
                    <Text className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">
                      Sample Digital Policy
                    </Text>
                    <Heading size="5" className="font-extrabold text-gray-900">
                      Standard Health Plan
                    </Heading>
                  </Box>
                  <Flex direction="column" gap="4" mb="8">
                    <Flex justify="between">
                      <Text size="2" color="gray" weight="medium">
                        Coverage Limit
                      </Text>
                      <Text
                        size="2"
                        color="gray"
                        weight="bold"
                        className="text-gray-900"
                      >
                        Rp 500.000.000
                      </Text>
                    </Flex>
                    <Flex justify="between">
                      <Text size="2" color="gray" weight="medium">
                        Premium
                      </Text>
                      <Text
                        size="2"
                        color="gray"
                        weight="bold"
                        className="text-gray-900"
                      >
                        Rp 2.500.000/yr
                      </Text>
                    </Flex>
                    <Flex justify="between">
                      <Text size="2" color="gray" weight="medium">
                        Status
                      </Text>
                      <Text size="2" color="blue" weight="bold">
                        Fully Insured
                      </Text>
                    </Flex>
                  </Flex>
                  <Box className="relative w-full h-12 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200">
                    <Box className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-16 h-4 bg-gray-200 rounded-full" />
                  </Box>
                </Card>
                <Flex
                  direction="column"
                  gap="2"
                  className="absolute bottom-4 right-4 md:bottom-10 md:right-10 bg-[#1669FF] text-white p-5 rounded-[24px] shadow-2xl min-w-[140px]"
                >
                  <Box className="relative w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Icons.LightningBoltIcon
                      width="20"
                      height="20"
                      className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2"
                    />
                  </Box>
                  <Box mt="2">
                    <Text className="text-[9px] text-white/80 font-extrabold uppercase tracking-widest block mb-1">
                      Approval Time
                    </Text>
                    <Text
                      size="4"
                      weight="bold"
                      className="leading-tight block"
                    >
                      Under 2 minutes
                    </Text>
                  </Box>
                </Flex>
              </Box>
            </Box>
          </Flex>
        </Container>
      </Section>

      {/* How It Works Section */}
      <Section className="py-24 bg-gray-50">
        <Container size="4" className="px-6">
          <Box className="text-center max-w-2xl mx-auto mb-16">
            <Heading size="8" mb="4" className="text-gray-900 font-extrabold">
              How It Works
            </Heading>
            <Text color="gray" size="3">
              Getting protected is easier than ever with our digital-first
              approach.
            </Text>
          </Box>
          <Grid columns={{ initial: "1", md: "3" }} gap="9">
            {[
              {
                title: "Choose Plan",
                desc: "Select the coverage that fits your lifestyle and budget from our curated range.",
                icon: <Icons.MixerHorizontalIcon width="32" height="32" />,
              },
              {
                title: "Secure Payment",
                desc: "Pay safely using our encrypted fintech-grade gateway with multiple options.",
                icon: <Icons.LockClosedIcon width="32" height="32" />,
              },
              {
                title: "Instant Confirmation",
                desc: "Receive your digital policy instantly via email and through our dedicated app.",
                icon: <Icons.EnvelopeClosedIcon width="32" height="32" />,
              },
            ].map((item, i) => (
              <Flex key={i} direction="column" align="center">
                <Box className="relative w-20 h-20 bg-white shadow-md rounded-[24px] mb-8 text-blue-600">
                  <Box className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    {item.icon}
                  </Box>
                </Box>
                <Heading
                  size="5"
                  align="center"
                  mb="3"
                  className="text-gray-900 font-bold"
                >
                  {item.title}
                </Heading>
                <Text
                  size="2"
                  color="gray"
                  align="center"
                  className="leading-relaxed px-4"
                >
                  {item.desc}
                </Text>
              </Flex>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Insurance Plans Section */}
      <Section id="plans" className="py-24 bg-white">
        <Container size="4" className="px-6">
          <Box mb="9">
            <Heading size="8" mb="2" className="text-gray-900 font-extrabold">
              Insurance Plans
            </Heading>
            <Text color="gray" size="3">
              Transparent pricing. No hidden fees.
            </Text>
          </Box>
          <Grid columns={{ initial: "1", md: "3" }} gap="8" align="stretch">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                size="4"
                className={`flex flex-col rounded-[32px] p-8 transition-all relative cursor-pointer ${
                  plan.popular
                    ? "bg-white border-[3px] border-blue-600 shadow-2xl scale-105 z-10"
                    : "bg-white border-2 border-gray-50 shadow-sm"
                }`}
                onClick={() =>
                  dispatch({ type: "SET_SELECTED_PLAN", payload: plan.name })
                }
              >
                <Flex direction="column" gap="6" className="h-full">
                  <Box>
                    <Heading
                      size="6"
                      weight="bold"
                      mb="5"
                      className="text-gray-900"
                    >
                      {plan.name}
                    </Heading>
                    <Flex align="baseline" gap="1" mb="3">
                      <Text className="text-3xl font-extrabold text-gray-900">
                        Rp {plan.price.toLocaleString("id-ID")}
                      </Text>
                      <Text size="2" color="gray" weight="medium">
                        /yr
                      </Text>
                    </Flex>
                    <Text
                      size="1"
                      color="gray"
                      weight="medium"
                      className="leading-relaxed"
                    >
                      {plan.description}
                    </Text>
                  </Box>
                  <Flex direction="column" gap="4" flexGrow="1">
                    {plan.features.map((feat, idx) => (
                      <Flex key={idx} align="center" gap="3">
                        <Box className="text-blue-600 flex-shrink-0">
                          <Icons.CheckCircledIcon />
                        </Box>
                        <Text
                          size="1"
                          weight="medium"
                          className="text-gray-600"
                        >
                          {feat}
                        </Text>
                      </Flex>
                    ))}
                  </Flex>
                  <Button
                    size="4"
                    onClick={(e) => {
                      e.stopPropagation();
                      scrollToCheckout(plan.name);
                    }}
                    className={`w-full h-14 rounded-xl font-bold transition-all cursor-pointer ${
                      plan.name === selectedPlan
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                        : "bg-gray-50 text-gray-900"
                    }`}
                  >
                    Buy Plan
                  </Button>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Checkout Section */}
      <Section
        ref={checkoutRef}
        className="py-24 bg-white border-t border-gray-50"
      >
        <Container size="3" className="px-6">
          <Box className="text-center mb-16">
            <Heading size="8" mb="4" className="text-gray-900 font-extrabold">
              Complete Your Purchase
            </Heading>
            <Text color="gray" size="3">
              You have selected the{" "}
              <Text weight="bold" className="text-blue-600">
                {selectedPlan} Plan
              </Text>
            </Text>
          </Box>

          <Card
            size="4"
            className="bg-white border-2 border-gray-50 rounded-[32px] p-8 md:p-12 shadow-2xl shadow-gray-100"
          >
            <form onSubmit={handlePay}>
              <Flex direction="column" gap="8">
                <Grid columns={{ initial: "1", md: "2" }} gap="6">
                  <Flex direction="column" gap="1">
                    <Text
                      size="1"
                      weight="bold"
                      className="uppercase tracking-widest text-gray-400 px-1 block"
                    >
                      Full Name
                    </Text>
                    <TextField.Root
                      required
                      size="3"
                      placeholder="e.g. John Doe"
                      className="h-14 rounded-2xl border-none bg-gray-50 focus-within:bg-white transition-all shadow-none"
                      value={fullName}
                      onChange={(e) =>
                        dispatch({
                          type: "SET_FULL_NAME",
                          payload: e.target.value,
                        })
                      }
                    />
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Text
                      size="1"
                      weight="bold"
                      className="uppercase tracking-widest text-gray-400 px-1 block"
                    >
                      Email Address
                    </Text>
                    <TextField.Root
                      required
                      type="email"
                      size="3"
                      placeholder="e.g. john@example.com"
                      className="h-14 rounded-2xl border-none bg-gray-50 focus-within:bg-white transition-all shadow-none"
                      value={email}
                      onChange={(e) =>
                        dispatch({ type: "SET_EMAIL", payload: e.target.value })
                      }
                    />
                  </Flex>
                </Grid>

                <Flex direction="column" gap="1">
                  <Text
                    size="1"
                    weight="bold"
                    className="uppercase tracking-widest text-gray-400 px-1 block"
                  >
                    Card Number
                  </Text>
                  <TextField.Root
                    required
                    size="3"
                    className="h-14 rounded-2xl border-none bg-gray-50 focus-within:bg-white transition-all shadow-none"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    placeholder="0000 0000 0000 0000"
                  >
                    <TextField.Slot>
                      <Icons.CardStackIcon width="20" height="20" />
                    </TextField.Slot>
                  </TextField.Root>
                </Flex>

                <Grid columns="2" gap="6">
                  <Flex direction="column" gap="1">
                    <Text
                      size="1"
                      weight="bold"
                      className="uppercase tracking-widest text-gray-400 px-1 block"
                    >
                      Expiry Date
                    </Text>
                    <TextField.Root
                      required
                      size="3"
                      placeholder="MM/YY"
                      className="h-14 rounded-2xl border-none bg-gray-50 focus-within:bg-white transition-all shadow-none"
                      value={expiryDate}
                      onChange={handleExpiryDateChange}
                    />
                  </Flex>
                  <Flex direction="column" gap="1">
                    <Text
                      size="1"
                      weight="bold"
                      className="uppercase tracking-widest text-gray-400 px-1 block"
                    >
                      CVV
                    </Text>
                    <TextField.Root
                      required
                      size="3"
                      placeholder="123"
                      className="h-14 rounded-2xl border-none bg-gray-50 focus-within:bg-white transition-all shadow-none"
                      value={cvv}
                      onChange={handleCvvChange}
                      maxLength={3}
                    />
                  </Flex>
                </Grid>

                <Button
                  size="4"
                  type="submit"
                  className="w-full h-16 bg-blue-600 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-100 cursor-pointer"
                >
                  <Icons.LockClosedIcon className="hidden md:block" />
                  <span>
                    Pay Rp {selectedPlanData.price.toLocaleString("id-ID")} Now
                  </span>
                </Button>

                <Flex
                  justify="center"
                  align="center"
                  gap="2"
                  className="text-gray-400"
                >
                  <Icons.LockClosedIcon
                    width="14"
                    height="14"
                    className="hidden md:block"
                  />
                  <Text
                    size="1"
                    weight="bold"
                    className="uppercase tracking-widest"
                  >
                    Payments are secure and 256-bit encrypted
                  </Text>
                </Flex>
              </Flex>
            </form>
          </Card>
        </Container>
      </Section>

      {/* Fintech Section */}
      <Section className="py-24 bg-[#0B1121] text-white">
        <Container size="4" className="px-6 text-center">
          <Flex
            justify="center"
            gap="9"
            mb="9"
            className="opacity-50 grayscale invert flex-wrap"
          >
            <Flex align="center" gap="2">
              <Icons.LockClosedIcon width="16" height="16" />
              <Text
                size="1"
                weight="bold"
                className="uppercase tracking-widest"
              >
                AES-256 Encrypted
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Icons.TargetIcon width="16" height="16" />
              <Text
                size="1"
                weight="bold"
                className="uppercase tracking-widest"
              >
                PCI-DSS Compliant
              </Text>
            </Flex>
            <Flex align="center" gap="2">
              <Icons.GlobeIcon width="16" height="16" />
              <Text
                size="1"
                weight="bold"
                className="uppercase tracking-widest"
              >
                Bank-Grade Tech
              </Text>
            </Flex>
          </Flex>
          <Heading size="8" mb="6" className="font-extrabold">
            Secure Fintech Payments
          </Heading>
          <Text
            size="3"
            color="gray"
            className="max-w-2xl mx-auto mb-12 leading-relaxed block"
          >
            We use bank-level encryption and secure payment gateways to ensure
            your transactions and personal data are always protected. Experience
            instant confirmation with zero friction.
          </Text>
          <Flex justify="center" gap="4">
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                className="relative w-12 h-12 bg-white/5 rounded-xl border border-white/10"
              >
                <Box className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2 w-6 h-2 bg-white/20 rounded-full" />
              </Box>
            ))}
          </Flex>
        </Container>
      </Section>

      {/* Footer */}
      <Box className="py-20 bg-white border-t border-gray-50">
        <Container size="4" className="px-6">
          <Grid columns={{ initial: "1", md: "4" }} gap="9" mb="9">
            <Flex direction="column" gap="6">
              <Flex align="center" gap="2">
                <Box className="relative w-8 h-8 bg-blue-600 rounded-lg text-white">
                  <Icons.PlusIcon className="absolute top-1/2 right-1/2 translate-x-1/2 -translate-y-1/2" />
                </Box>
                <Text size="5" weight="bold" className="text-[#111827]">
                  InsureHealth
                </Text>
              </Flex>
              <Text size="2" color="gray" className="leading-relaxed">
                Making quality healthcare accessible and affordable through
                digital innovation.
              </Text>
            </Flex>
            <Box>
              <Heading
                size="1"
                weight="bold"
                className="uppercase tracking-widest text-gray-900"
                mb="6"
              >
                Product
              </Heading>
              <Box className="space-y-4 list-none p-0">
                {["Basic Plan", "Standard Plan", "Premium Plan"].map((item) => (
                  <Box key={item}>
                    <Text
                      size="1"
                      weight="medium"
                      color="gray"
                      className="cursor-pointer"
                    >
                      {item}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box>
              <Heading
                size="1"
                weight="bold"
                className="uppercase tracking-widest text-gray-900"
                mb="6"
              >
                Company
              </Heading>
              <Box className="space-y-4 list-none p-0">
                {["About Us", "Contact", "Careers"].map((item) => (
                  <Box key={item}>
                    <Text
                      size="1"
                      weight="medium"
                      color="gray"
                      className="cursor-pointer"
                    >
                      {item}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
            <Box>
              <Heading
                size="1"
                weight="bold"
                className="uppercase tracking-widest text-gray-900"
                mb="6"
              >
                Legal
              </Heading>
              <Box className="space-y-4 list-none p-0">
                {["Terms of Service", "Privacy Policy", "Cookie Policy"].map(
                  (item) => (
                    <Box key={item}>
                      <Text
                        size="1"
                        weight="medium"
                        color="gray"
                        className="cursor-pointer"
                      >
                        {item}
                      </Text>
                    </Box>
                  ),
                )}
              </Box>
            </Box>
          </Grid>
          <Box className="pt-12 border-t border-gray-50">
            <Text size="1" color="gray" className="mb-6 leading-relaxed block">
              Disclaimer: InsureHealth is a digital insurance broker registered
              and supervised by OJK. All insurance products are underwritten by
              licensed insurance carriers. Coverage is subject to the terms and
              conditions of the specific policy selected.
            </Text>
            <Text size="1" color="gray">
              © {new Date().getFullYear()} InsureHealth. All rights reserved.
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
