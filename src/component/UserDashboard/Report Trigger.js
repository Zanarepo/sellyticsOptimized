import React, { useState } from "react";
import { supabase } from "../../supabaseClient";

const Test = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    setResponse(null);

    try {
      // ✅ Use Supabase client to invoke the Edge Function
      const { data, error } = await supabase.functions.invoke("weekly_report", {
        body: {
          slack_webhook_url: slackWebhookUrl || undefined,
        },
      });

      if (error) {
        console.error("Supabase Edge Function Error:", error);
        throw new Error(error.message || "Failed to call Supabase Edge Function.");
      }

      setResponse(data);
    } catch (err) {
      console.error("Error triggering report:", err);
      setError(err.message || "An error occurred while calling the Edge Function.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl sm:p-8">
      <h1 className="text-3xl font-extrabold text-center text-indigo-800 mb-6 sm:text-4xl">
        Slack Sales Reporter
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="slackWebhookUrl" className="block text-sm font-medium text-gray-700">
            Optional Slack Webhook URL
          </label>
          <input
            type="text"
            id="slackWebhookUrl"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            value={slackWebhookUrl}
            onChange={(e) => setSlackWebhookUrl(e.target.value)}
            placeholder="Overrides environment variable in Edge Function"
          />
        </div>

        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md 
                     shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 
                     disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : "Trigger Slack Report"}
        </button>
      </form>

      {error && (
        <div className="mt-6 p-4 rounded-md bg-red-100 text-red-700 border border-red-200">
          <h3 className="text-lg font-medium">Error:</h3>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      )}

      {response && (
        <div className="mt-6 p-4 rounded-md bg-green-100 text-green-800 border border-green-200">
          <h3 className="text-lg font-medium text-green-900">Report Sent Successfully!</h3>
          <p className="mt-2 text-sm">
            Status: <span className="font-semibold">{response.status}</span>
          </p>

          <div className="mt-4">
            <h4 className="font-semibold text-green-900">Top 10 Sales by Store:</h4>
            {response.topStores && Object.keys(response.topStores).length > 0 ? (
              <ul className="list-disc list-inside mt-2 text-sm">
                {Object.entries(response.topStores).map(([store, total]) => (
                  <li key={store}>
                    {store}: ₦{Number(total).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm italic">No sales data available.</p>
            )}
          </div>

          <div className="mt-4 text-xs text-gray-600">
            <h5 className="font-semibold">Debug Info:</h5>
            <p>Sales Records Processed: {response.debug?.salesCount}</p>
            <p>Sales Date Range: {response.debug?.dateRange}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Test;
