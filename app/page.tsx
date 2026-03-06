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
import { useReducer } from "react";
import { createOrder, triggerWebhook } from "./api/client";
import { initialState, paymentReducer } from "./reducers/payment";

const plans = [
  {
    name: "Basic",
    price: 750000,
    description: "Essential coverage for individuals.",
    icon: <Icons.PersonIcon width="24" height="24" />,
  },
  {
    name: "Family",
    price: 2250000,
    description: "Comprehensive coverage for the whole family.",
    popular: true,
    icon: <Icons.FaceIcon width="24" height="24" />,
  },
  {
    name: "Executive",
    price: 7500000,
    description: "Premium coverage with exclusive perks.",
    icon: <Icons.StarFilledIcon width="24" height="24" />,
  },
];

export default function Home() {
  const [state, dispatch] = useReducer(paymentReducer, initialState);

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

  const selectedPlanData =
    plans.find((p) => p.name === selectedPlan) || plans[1];

  if (step === "success") {
    return (
      <Container size="2" p="4">
        <Section py="9">
          <Card
            size="4"
            variant="surface"
            className=" max-md:border-none! max-md:bg-transparent! max-md:shadow-none!"
          >
            <Flex direction="column" align="center" gap="5" p="5">
              <Box
                style={{
                  backgroundColor: "var(--green-3)",
                  padding: "16px",
                  borderRadius: "100%",
                  color: "var(--green-9)",
                }}
              >
                <Icons.CheckCircledIcon width="48" height="48" />
              </Box>

              <Flex direction="column" align="center" gap="2">
                <Heading size="8" align="center">
                  Payment Successful
                </Heading>
                <Text align="center" color="gray" size="3">
                  Your payment for <strong>HealthSafe {selectedPlan}</strong>{" "}
                  insurance has been successfully processed. Thank you for
                  choosing us.
                </Text>
              </Flex>

              <Card
                variant="surface"
                style={{ width: "100%", maxWidth: "400px" }}
              >
                <Flex direction="column" align="center" gap="1">
                  <Text size="2" weight="medium" color="gray">
                    Transaction ID
                  </Text>
                  <Text
                    size="2"
                    weight="bold"
                    align="center"
                    style={{
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                    }}
                  >
                    {transactionId || "HS-987654321"}
                  </Text>
                </Flex>
              </Card>

              <Flex direction="column" gap="3" width="100%" maxWidth="400px">
                <Button
                  size="3"
                  variant="solid"
                  highContrast
                  style={{ width: "100%" }}
                >
                  <Icons.DownloadIcon />
                  Download Receipt
                </Button>
                <Button
                  size="3"
                  variant="outline"
                  style={{ width: "100%" }}
                  onClick={handleReturnToDashboard}
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
            className="max-md:border-none! max-md:bg-transparent! max-md:shadow-none!"
          >
            <Flex direction="column" align="center" gap="5" p="5">
              <Box
                style={{
                  backgroundColor: "var(--red-3)",
                  padding: "16px",
                  borderRadius: "100%",
                  color: "var(--red-9)",
                }}
              >
                <Icons.ExclamationTriangleIcon width="48" height="48" />
              </Box>

              <Flex direction="column" align="center" gap="2">
                <Heading size="8" align="center" color="red">
                  Payment Failed
                </Heading>
                <Text align="center" color="gray" size="3">
                  {(paymentMutation.error as Error)?.message ||
                    "We encountered an issue while processing your payment. Please check your details and try again."}
                </Text>
              </Flex>

              <Box width="100%" maxWidth="400px" mt="2">
                <Button
                  size="3"
                  variant="solid"
                  color="gray"
                  style={{ width: "100%" }}
                  onClick={handleReturnToDashboard}
                >
                  <Icons.ArrowLeftIcon />
                  Return to Payment Details
                </Button>
              </Box>
            </Flex>
          </Card>
        </Section>
      </Container>
    );
  }

  if (step === "processing") {
    return (
      <Container size="2" p="4">
        <Section py="9">
          <Card
            size="4"
            className="max-md:border-none! max-md:bg-transparent! max-md:shadow-none!"
          >
            <Flex direction="column" align="center" gap="5">
              <Heading size="7">Processing Payment</Heading>
              <Text size="2" color="gray" mb="4">
                Please do not close or refresh this window.
              </Text>

              <Flex direction="column" align="center" gap="3" py="6">
                <Spinner size="3" />
                <Text size="2" weight="medium">
                  Contacting your bank...
                </Text>
              </Flex>

              <Box width="100%" style={{ opacity: 0.5, pointerEvents: "none" }}>
                <Flex direction="column" gap="4">
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold">
                      Card Information
                    </Text>
                    <TextField.Root disabled placeholder="**** **** **** 1234">
                      <TextField.Slot>
                        <Icons.CardStackIcon />
                      </TextField.Slot>
                    </TextField.Root>
                  </Flex>
                </Flex>
              </Box>
            </Flex>
          </Card>
        </Section>
      </Container>
    );
  }

  return (
    <Container size="3" p="4">
      <Section
        py={{
          initial: "4",
          md: "8",
        }}
      >
        <Flex direction="column" gap="8">
          <Box>
            <Heading size="8" mb="6">
              Select a Plan
            </Heading>
            <Grid columns={{ initial: "1", md: "3" }} gap="6" align="stretch">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  size="3"
                  variant="surface"
                  style={{
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.2s ease-in-out",
                    outline:
                      selectedPlan === plan.name
                        ? "2px solid var(--blue-9)"
                        : "none",
                    outlineOffset: "2px",
                    height: "100%",
                    overflow: "visible",
                  }}
                  onClick={() =>
                    dispatch({ type: "SET_SELECTED_PLAN", payload: plan.name })
                  }
                >
                  <Flex direction="column" gap="4" style={{ height: "100%" }}>
                    <Flex justify="between" align="center">
                      <Text color="blue">{plan.icon}</Text>
                      <Heading size="4" color="gray">
                        {plan.name}
                      </Heading>
                    </Flex>

                    <Flex direction="column" gap="1">
                      <Flex align="baseline" gap="1">
                        <Text size="7" weight="bold">
                          Rp {plan.price.toLocaleString("id-ID")}
                        </Text>
                        <Text size="2" color="gray">
                          /mo
                        </Text>
                      </Flex>
                      <Text size="2" color="gray">
                        {plan.description}
                      </Text>
                    </Flex>

                    <Box mt="auto" pt="4">
                      <Button
                        size="2"
                        variant={
                          selectedPlan === plan.name ? "solid" : "outline"
                        }
                        style={{ width: "100%" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          dispatch({
                            type: "SET_SELECTED_PLAN",
                            payload: plan.name,
                          });
                        }}
                      >
                        {selectedPlan === plan.name
                          ? "Selected"
                          : "Select Plan"}
                      </Button>
                    </Box>
                  </Flex>
                </Card>
              ))}
            </Grid>
          </Box>

          <Separator size="4" />

          <Box>
            <Heading size="8" mb="6">
              Checkout Details
            </Heading>
            <Card
              size="4"
              className="max-md:border-none! max-md:bg-transparent! max-md:shadow-none!"
            >
              <form onSubmit={handlePay}>
                <Flex direction="column" gap="5">
                  <Grid columns={{ initial: "1", md: "2" }} gap="5">
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold">
                        Full Name
                      </Text>
                      <TextField.Root
                        required
                        placeholder="e.g. John Doe"
                        size="3"
                        value={fullName}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_FULL_NAME",
                            payload: e.target.value,
                          })
                        }
                      />
                    </Flex>
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold">
                        Email Address
                      </Text>
                      <TextField.Root
                        required
                        type="email"
                        placeholder="e.g. john@example.com"
                        size="3"
                        value={email}
                        onChange={(e) =>
                          dispatch({
                            type: "SET_EMAIL",
                            payload: e.target.value,
                          })
                        }
                      />
                    </Flex>
                  </Grid>

                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold">
                      Card Number
                    </Text>
                    <TextField.Root
                      required
                      size="3"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                    >
                      <TextField.Slot>
                        <Icons.CardStackIcon />
                      </TextField.Slot>
                    </TextField.Root>
                  </Flex>

                  <Grid columns="2" gap="5">
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold">
                        Expiry Date
                      </Text>
                      <TextField.Root
                        required
                        size="3"
                        value={expiryDate}
                        onChange={handleExpiryDateChange}
                        placeholder="MM/YY"
                      />
                    </Flex>
                    <Flex direction="column" gap="2">
                      <Text size="2" weight="bold">
                        CVV
                      </Text>
                      <TextField.Root
                        required
                        size="3"
                        value={cvv}
                        onChange={handleCvvChange}
                        placeholder="123"
                        maxLength={3}
                      />
                    </Flex>
                  </Grid>

                  <Box pt="4">
                    <Button size="3" style={{ width: "100%" }} type="submit">
                      <Icons.LockClosedIcon />
                      Pay Rp {selectedPlanData.price.toLocaleString(
                        "id-ID",
                      )}{" "}
                      Now
                    </Button>
                  </Box>

                  <Flex justify="center" align="center" gap="1">
                    <Icons.LockClosedIcon color="gray" />
                    <Text size="1" color="gray">
                      Payments are secure and encrypted.
                    </Text>
                  </Flex>
                </Flex>
              </form>
            </Card>
          </Box>
        </Flex>
      </Section>
      <Separator size="4" />
      <Box py="6">
        <Text align="center" size="1" color="gray" as="p">
          Secure 256-bit SSL encryption. HealthSafe © {new Date().getFullYear()}
        </Text>
      </Box>
    </Container>
  );
}
