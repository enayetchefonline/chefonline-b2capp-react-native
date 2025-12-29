import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Alert, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ryftpayPaymentSuccess } from '../../../../lib/utils/ryftpay-api'; // Adjust import path
export default function RyftPayProcessing() {
	const {responseData,configData, transactionId, clientSecret} = useLocalSearchParams();
	const navigation = useNavigation();
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	useLayoutEffect(() => {
		navigation.setOptions({
			headerShown: true,
			title: 'Payment Processing',
			headerBackTitleVisible: false,
		});
	}, [navigation]);

	const ryftHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://embedded.ryftpay.com/v1/ryft.min.js"></script>
      <title>Processing Payment...</title>
    </head>
    <body>
      <script>
        const responseDataCash = ${responseData};
        const clientSecret = '${clientSecret}';
        const transactionId = '${transactionId}';
        const apiKey = "pk_MvGLGNuwuIEpVfTmmuQlhmcjz3/GSNkdJ+NO9fxKZWGs60tDTO+EkRgKyY5H4beZ";

        window.onload = function() {
          let requiredActionJson = responseDataCash.requiredAction ;

          if (!requiredActionJson) {
            alert('Required action data is missing. Please check the response.');
            return;
          }

          Ryft.handleRequiredAction(requiredActionJson, apiKey, clientSecret)
            .then((paymentSession) => {
              if (paymentSession.status === 'Approved' || paymentSession.status === 'Captured') {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'success', transactionId: transactionId }));
              } else if (paymentSession.lastError) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', transactionId: transactionId }));
              }
            })
            .catch((error) => {
              window.ReactNativeWebView.postMessage(JSON.stringify({ status: 'error', transactionId: transactionId }));
            });
        };
      </script>
    </body>
    </html>
  `;
	const handleWebViewMessage = async (event) => {
		const data = JSON.parse(event.nativeEvent.data);
		if (data.status === 'success') {
			try {
				setLoading(true);
				   await ryftpayPaymentSuccess(
			          transactionId, // Passing transaction ID from route
					  configData, // Ensure that responseData is correctly structured
					);
				router.push({
					pathname: '/card-order-success',
					params: {
						orderId: configData.metadata?.orderId || 'N/A',
						status: 'success',
						message: 'Your order has been successfully placed.',
						transactionId: transactionId || 'N/A',
					},
				});
			} catch (error) {
				console.error('Error calling ryftpayPaymentSuccess:', error);
				Alert.alert('Error', 'Payment failed. Please try again.');
			} finally {
				setLoading(false);
			}
		} else if (data.status === 'error') {
			router.push({
				pathname: '/card-order-success',
				params: {
					orderId: responseData.metadata?.orderId || 'N/A',
					status: 0,
					message: 'Payment failed.',
					transactionId: transactionId || 'N/A',
				},
			});
			setLoading(false);
		}
	};
	return (
		<View style={{flex: 1}}>
			{loading && (
				<View style={{justifyContent: 'center', alignItems: 'center', flex: 1}}>
					<ActivityIndicator size="large" color="#0000ff" />
					<Text>Processing Payment...</Text>
				</View>
			)}
			<WebView
				originWhitelist={['*']}
				source={{html: ryftHtml}}
				onMessage={handleWebViewMessage}
				onLoadEnd={() => setLoading(false)} // Hide spinner after WebView loads
			/>
		</View>
	);
}
