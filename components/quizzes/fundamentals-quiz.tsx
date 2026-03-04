"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardText, CardTitle } from "@/components/ui/card";
import { scoreFundamentalsQuiz } from "@/src/server/services/quiz-service";

const QUESTIONS = [
  {
    id: "compound-interest",
    question: "Compound interest means growth can build on past growth over time.",
    correct: "true",
  },
  {
    id: "marginal-tax",
    question: "A marginal tax rate means every dollar is taxed at the highest rate.",
    correct: "false",
  },
  {
    id: "diversification",
    question: "Diversification is one way to spread risk across different assets.",
    correct: "true",
  },
];

export function FundamentalsQuiz() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);

  function submit() {
    const correctAnswers = QUESTIONS.filter((question) => answers[question.id] === question.correct).length;
    setResult(scoreFundamentalsQuiz(correctAnswers, QUESTIONS.length));
  }

  return (
    <Card className="space-y-5">
      <CardTitle>Finance fundamentals check</CardTitle>
      <CardText>
        This short quiz helps show which learning modules may be most useful next.
      </CardText>
      <div className="space-y-4">
        {QUESTIONS.map((question) => (
          <fieldset key={question.id} className="rounded-3xl border border-border bg-white p-4">
            <legend className="text-sm font-medium">{question.question}</legend>
            <div className="mt-3 flex gap-4">
              {["true", "false"].map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={question.id}
                    value={value}
                    checked={answers[question.id] === value}
                    onChange={(event) =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: event.currentTarget.value,
                      }))
                    }
                  />
                  {value}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      <Button type="button" onClick={submit}>
        See my result
      </Button>
      {result ? <p className="text-sm font-semibold text-primary-strong">{result}</p> : null}
    </Card>
  );
}
