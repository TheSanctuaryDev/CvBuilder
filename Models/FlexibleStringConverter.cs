using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace CvBuilderApp.Models
{
    /// <summary>
    /// Convertit en string n'importe quel token JSON (string, number, bool, objet, tableau).
    /// Utile quand Gemini renvoie un objet {} ou un tableau [] là où on attend une string.
    /// </summary>
    public class FlexibleStringConverter : JsonConverter<string?>
    {
        public override string? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.TokenType switch
            {
                JsonTokenType.String => reader.GetString(),
                JsonTokenType.Null => null,
                JsonTokenType.True => "true",
                JsonTokenType.False => "false",
                JsonTokenType.Number => reader.GetDecimal().ToString(),
                // Si c'est un objet {} ou un tableau [], on le sérialise en string JSON
                JsonTokenType.StartObject or JsonTokenType.StartArray => FlattenToString(ref reader),
                _ => null
            };
        }

        private static string FlattenToString(ref Utf8JsonReader reader)
        {
            // On relit le bloc complet (objet ou tableau) et on extrait les valeurs texte
            using var doc = JsonDocument.ParseValue(ref reader);
            return ExtractText(doc.RootElement);
        }

        private static string ExtractText(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString() ?? "",
                JsonValueKind.Number => element.GetDecimal().ToString(),
                JsonValueKind.True => "true",
                JsonValueKind.False => "false",
                JsonValueKind.Null => "",
                JsonValueKind.Array => string.Join(", ", element.EnumerateArray().Select(ExtractText)),
                JsonValueKind.Object => string.Join(", ", element.EnumerateObject()
                    .Where(p => p.Value.ValueKind != JsonValueKind.Null)
                    .Select(p => p.Value.ValueKind == JsonValueKind.String ? p.Value.GetString() ?? "" : ExtractText(p.Value))),
                _ => ""
            };
        }

        public override void Write(Utf8JsonWriter writer, string? value, JsonSerializerOptions options)
        {
            if (value is null)
                writer.WriteNullValue();
            else
                writer.WriteStringValue(value);
        }
    }

    /// <summary>
    /// Convertit en List<string> n'importe quel token JSON.
    /// Gère les cas où Gemini renvoie une string à la place d'un tableau, ou un tableau d'objets.
    /// </summary>
    public class FlexibleStringListConverter : JsonConverter<List<string>?>
    {
        public override List<string>? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            return reader.TokenType switch
            {
                JsonTokenType.Null => new List<string>(),
                // Si Gemini renvoie une string à la place d'un tableau
                JsonTokenType.String => new List<string> { reader.GetString() ?? "" },
                // Cas normal : tableau JSON
                JsonTokenType.StartArray => ReadArray(ref reader),
                // Si Gemini renvoie un objet {} à la place d'un tableau
                JsonTokenType.StartObject => ReadObject(ref reader),
                _ => new List<string>()
            };
        }

        private static List<string> ReadArray(ref Utf8JsonReader reader)
        {
            var result = new List<string>();
            while (reader.Read() && reader.TokenType != JsonTokenType.EndArray)
            {
                switch (reader.TokenType)
                {
                    case JsonTokenType.String:
                        result.Add(reader.GetString() ?? "");
                        break;
                    case JsonTokenType.StartObject:
                    case JsonTokenType.StartArray:
                        using (var doc = JsonDocument.ParseValue(ref reader))
                        {
                            string text = FlattenElementToString(doc.RootElement);
                            if (!string.IsNullOrWhiteSpace(text))
                                result.Add(text);
                        }
                        break;
                    case JsonTokenType.Number:
                        result.Add(reader.GetDecimal().ToString());
                        break;
                }
            }
            return result;
        }

        private static List<string> ReadObject(ref Utf8JsonReader reader)
        {
            var result = new List<string>();
            using var doc = JsonDocument.ParseValue(ref reader);
            foreach (var prop in doc.RootElement.EnumerateObject())
            {
                string text = FlattenElementToString(prop.Value);
                if (!string.IsNullOrWhiteSpace(text))
                    result.Add(text);
            }
            return result;
        }

        private static string FlattenElementToString(JsonElement element)
        {
            return element.ValueKind switch
            {
                JsonValueKind.String => element.GetString() ?? "",
                JsonValueKind.Number => element.GetDecimal().ToString(),
                JsonValueKind.Array => string.Join(" | ", element.EnumerateArray().Select(FlattenElementToString)),
                JsonValueKind.Object => string.Join(", ", element.EnumerateObject()
                    .Select(p => FlattenElementToString(p.Value))),
                _ => ""
            };
        }

        public override void Write(Utf8JsonWriter writer, List<string>? value, JsonSerializerOptions options)
        {
            if (value is null)
            {
                writer.WriteNullValue();
                return;
            }
            writer.WriteStartArray();
            foreach (var item in value)
                writer.WriteStringValue(item);
            writer.WriteEndArray();
        }
    }
}
